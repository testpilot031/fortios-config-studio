#!/usr/bin/env node

/**
 * Fortinet RSS Monitor for FortiOS Version Updates
 * Monitors RSS feed for new FortiOS versions and updates keywords automatically
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { updateTmLanguageFile } = require('./update-keywords-from-version');

const RSS_URL = 'https://support.fortinet.com/rss/firmware.xml';
const VERSION_CACHE_FILE = path.join(__dirname, '../.fortios-versions.json');

/**
 * Parse XML RSS feed and extract FortiOS versions
 */
function parseFortiOSVersions(xmlContent) {
    const versions = [];
    
    // Simple regex-based XML parsing for RSS items
    const itemRegex = /<item>(.*?)<\/item>/gs;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
    const descriptionRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>/;
    
    let match;
    while ((match = itemRegex.exec(xmlContent)) !== null) {
        const itemContent = match[1];
        
        const titleMatch = titleRegex.exec(itemContent);
        const linkMatch = linkRegex.exec(itemContent);
        const pubDateMatch = pubDateRegex.exec(itemContent);
        const descriptionMatch = descriptionRegex.exec(itemContent);
        
        if (titleMatch) {
            const title = titleMatch[1];
            
            // Extract FortiOS version from title
            const fortiOSMatch = title.match(/FortiOS\s+(\d+\.\d+\.\d+)/i);
            if (fortiOSMatch) {
                const version = fortiOSMatch[1];
                const buildMatch = descriptionMatch ? descriptionMatch[1].match(/B(\d+)/) : null;
                
                versions.push({
                    version,
                    build: buildMatch ? buildMatch[1] : null,
                    title: title.trim(),
                    link: linkMatch ? linkMatch[1].trim() : null,
                    pubDate: pubDateMatch ? new Date(pubDateMatch[1]) : null,
                    description: descriptionMatch ? descriptionMatch[1].trim() : null
                });
            }
        }
    }
    
    return versions;
}

/**
 * Fetch and parse FortiOS versions from RSS feed
 */
async function fetchFortiOSVersions() {
    return new Promise((resolve, reject) => {
        console.log('Fetching FortiOS versions from RSS feed...');
        
        https.get(RSS_URL, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const versions = parseFortiOSVersions(data);
                    console.log(`✓ Found ${versions.length} FortiOS versions in RSS feed`);
                    resolve(versions);
                } catch (error) {
                    reject(new Error(`Failed to parse RSS feed: ${error.message}`));
                }
            });
        }).on('error', reject);
    });
}

/**
 * Load cached versions from file
 */
function loadCachedVersions() {
    try {
        if (fs.existsSync(VERSION_CACHE_FILE)) {
            const content = fs.readFileSync(VERSION_CACHE_FILE, 'utf8');
            const data = JSON.parse(content);
            console.log(`Loaded ${data.versions.length} cached versions (last updated: ${data.lastUpdated})`);
            return data;
        }
    } catch (error) {
        console.warn('Failed to load cached versions:', error.message);
    }
    
    return { versions: [], lastUpdated: null };
}

/**
 * Save versions to cache file
 */
function saveCachedVersions(versions) {
    try {
        const data = {
            versions,
            lastUpdated: new Date().toISOString(),
            lastCheck: new Date().toISOString()
        };
        
        fs.writeFileSync(VERSION_CACHE_FILE, JSON.stringify(data, null, 2));
        console.log('✓ Cached versions updated');
    } catch (error) {
        console.error('Failed to save cached versions:', error.message);
    }
}

/**
 * Compare versions to find new releases
 */
function findNewVersions(currentVersions, cachedVersions) {
    const cachedVersionStrings = new Set(cachedVersions.map(v => v.version));
    return currentVersions.filter(v => !cachedVersionStrings.has(v.version));
}

/**
 * Sort versions by semantic versioning
 */
function sortVersions(versions) {
    return versions.sort((a, b) => {
        const [aMajor, aMinor, aPatch] = a.version.split('.').map(Number);
        const [bMajor, bMinor, bPatch] = b.version.split('.').map(Number);
        
        if (aMajor !== bMajor) return bMajor - aMajor;
        if (aMinor !== bMinor) return bMinor - aMinor;
        return bPatch - aPatch;
    });
}

/**
 * Check for new FortiOS versions and update keywords if needed
 */
async function checkForUpdates() {
    try {
        const currentVersions = await fetchFortiOSVersions();
        const cachedData = loadCachedVersions();
        const newVersions = findNewVersions(currentVersions, cachedData.versions);
        
        if (newVersions.length === 0) {
            console.log('✓ No new FortiOS versions found');
            return { hasUpdates: false, versions: [] };
        }
        
        console.log(`🆕 Found ${newVersions.length} new FortiOS version(s):`);
        const sortedNewVersions = sortVersions(newVersions);
        
        sortedNewVersions.forEach(version => {
            console.log(`  • FortiOS ${version.version} (Build ${version.build || 'unknown'}) - ${version.pubDate?.toLocaleDateString() || 'unknown date'}`);
        });
        
        // Update cache with all current versions
        saveCachedVersions(currentVersions);
        
        return { hasUpdates: true, versions: sortedNewVersions, allVersions: currentVersions };
        
    } catch (error) {
        console.error('Failed to check for updates:', error.message);
        throw error;
    }
}

/**
 * Get the latest major versions for keyword updates
 */
function getLatestMajorVersions(versions, count = 3) {
    const majorVersionMap = new Map();
    
    // Group by major.minor version
    versions.forEach(version => {
        const [major, minor] = version.version.split('.');
        const majorMinor = `${major}.${minor}`;
        
        if (!majorVersionMap.has(majorMinor) || 
            version.version > majorVersionMap.get(majorMinor).version) {
            majorVersionMap.set(majorMinor, version);
        }
    });
    
    // Get the latest major versions
    return Array.from(majorVersionMap.values())
        .sort((a, b) => b.version.localeCompare(a.version))
        .slice(0, count);
}

/**
 * Main monitoring function
 */
async function main() {
    console.log('FortiOS RSS Monitor');
    console.log('===================');
    
    try {
        const result = await checkForUpdates();
        
        if (result.hasUpdates) {
            console.log('\n🔄 New versions detected! Updating keywords...');
            
            // Get latest versions from different major branches for keyword update
            const latestVersions = getLatestMajorVersions(result.allVersions, 3);
            console.log('Using these versions for keyword update:');
            latestVersions.forEach(v => console.log(`  • FortiOS ${v.version}`));
            
            // Load the update script and run it with new versions
            const { updateKeywordsFromVersions } = require('./update-keywords-from-version');
            const success = await updateKeywordsFromVersions(latestVersions.map(v => v.version));
            
            if (success) {
                console.log('✅ Keywords updated successfully!');
                console.log('\nNew versions found:');
                result.versions.forEach(version => {
                    console.log(`  • ${version.title} (${version.pubDate?.toLocaleDateString() || 'unknown date'})`);
                });
                
                return { updated: true, newVersions: result.versions };
            } else {
                console.log('⚠️ Keyword update failed, but version cache was updated');
                return { updated: false, newVersions: result.versions };
            }
        }
        
        return { updated: false, newVersions: [] };
        
    } catch (error) {
        console.error('Monitor failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().then(result => {
        if (result.updated) {
            console.log(`\n🎉 Successfully updated keywords based on ${result.newVersions.length} new version(s)`);
        } else if (result.newVersions.length > 0) {
            console.log(`\n⚠️ Found ${result.newVersions.length} new version(s) but keyword update failed`);
        } else {
            console.log('\n✓ No updates needed');
        }
    });
}

module.exports = { 
    checkForUpdates, 
    parseFortiOSVersions, 
    fetchFortiOSVersions,
    getLatestMajorVersions
};