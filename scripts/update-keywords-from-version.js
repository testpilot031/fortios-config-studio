#!/usr/bin/env node

/**
 * FortiOS Keywords Updater from Version Numbers
 * Dynamically constructs CLI reference URLs and fetches keywords
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const TMLANGUAGE_FILE = path.join(__dirname, '../syntaxes/fortios.tmLanguage.json');

/**
 * Construct CLI reference URL from FortiOS version
 * Uses patterns observed from Fortinet documentation URLs
 */
function buildCliReferenceUrl(version) {
    // Remove any build suffixes (e.g., "7.6.4-b1234" -> "7.6.4")
    const cleanVersion = version.replace(/[-+].*$/, '');
    
    // Different URL patterns for different versions
    const [major, minor, patch] = cleanVersion.split('.').map(Number);
    
    if (major >= 7 && minor >= 4) {
        // Newer versions use this pattern
        return `https://docs.fortinet.com/document/fortigate/${cleanVersion}/cli-reference/84566/fortios-cli-reference`;
    } else if (major >= 7 && minor >= 2) {
        // 7.2.x versions use this pattern
        return `https://docs.fortinet.com/document/fortigate/${cleanVersion}/cli-reference/708841/cli-configuration-commands`;
    } else {
        // Older versions fallback
        return `https://docs.fortinet.com/document/fortigate/${cleanVersion}/cli-reference`;
    }
}

/**
 * Alternative URL patterns to try if primary fails
 */
function getAlternativeUrls(version) {
    const cleanVersion = version.replace(/[-+].*$/, '');
    
    return [
        `https://docs.fortinet.com/document/fortigate/${cleanVersion}/cli-reference/84566`,
        `https://docs.fortinet.com/document/fortigate/${cleanVersion}/cli-reference/708841/cli-configuration-commands`,
        `https://docs.fortinet.com/document/fortigate/${cleanVersion}/cli-reference/708841`,
        `https://docs.fortinet.com/document/fortigate/${cleanVersion}/cli-reference`
    ];
}

/**
 * Fetch configuration keywords from a CLI reference URL
 */
async function fetchKeywordsFromUrl(url, version) {
    return new Promise((resolve, reject) => {
        console.log(`  Trying: ${url}`);
        
        const request = https.get(url, { timeout: 10000 }, (res) => {
            if (res.statusCode === 404) {
                console.log(`    ❌ 404 Not Found`);
                resolve([]);
                return;
            }
            
            if (res.statusCode !== 200) {
                console.log(`    ❌ HTTP ${res.statusCode}`);
                resolve([]);
                return;
            }
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    // Extract configuration keywords from documentation
                    const keywords = extractKeywordsFromContent(data);
                    if (keywords.length > 0) {
                        console.log(`    ✅ Found ${keywords.length} keywords`);
                        resolve(keywords);
                    } else {
                        console.log(`    ⚠️  No keywords found`);
                        resolve([]);
                    }
                } catch (error) {
                    console.log(`    ❌ Parse error: ${error.message}`);
                    resolve([]);
                }
            });
        });
        
        request.on('timeout', () => {
            console.log(`    ❌ Timeout`);
            request.destroy();
            resolve([]);
        });
        
        request.on('error', (error) => {
            console.log(`    ❌ Error: ${error.message}`);
            resolve([]);
        });
    });
}

/**
 * Extract configuration keywords from HTML content
 */
function extractKeywordsFromContent(htmlContent) {
    const keywords = new Set();
    
    // Pattern 1: Look for "config <keyword>" patterns
    const configMatches = htmlContent.match(/config\s+([a-z][a-z0-9-]+)/gi) || [];
    configMatches.forEach(match => {
        const keyword = match.replace(/^config\s+/i, '').toLowerCase();
        if (keyword && keyword.match(/^[a-z][a-z0-9-]*$/)) {
            keywords.add(keyword);
        }
    });
    
    // Pattern 2: Look for configuration section headers
    const sectionMatches = htmlContent.match(/<h[1-6][^>]*>config\s+([a-z][a-z0-9-]+)/gi) || [];
    sectionMatches.forEach(match => {
        const keyword = match.replace(/<h[1-6][^>]*>config\s+/i, '').toLowerCase();
        if (keyword && keyword.match(/^[a-z][a-z0-9-]*$/)) {
            keywords.add(keyword);
        }
    });
    
    // Pattern 3: Look for CLI command examples
    const codeMatches = htmlContent.match(/(?:^|\n|\r)\s*config\s+([a-z][a-z0-9-]+)/gim) || [];
    codeMatches.forEach(match => {
        const keyword = match.replace(/^[\s\n\r]*config\s+/i, '').toLowerCase();
        if (keyword && keyword.match(/^[a-z][a-z0-9-]*$/)) {
            keywords.add(keyword);
        }
    });
    
    // Filter out common false positives
    const filtered = Array.from(keywords).filter(keyword => {
        return !['example', 'sample', 'test', 'demo', 'config'].includes(keyword) &&
               keyword.length >= 3 && keyword.length <= 30;
    });
    
    return filtered;
}

/**
 * Fetch keywords for a specific FortiOS version
 */
async function fetchKeywordsForVersion(version) {
    console.log(`\nFetching keywords for FortiOS ${version}:`);
    
    // Try primary URL first
    const primaryUrl = buildCliReferenceUrl(version);
    let keywords = await fetchKeywordsFromUrl(primaryUrl, version);
    
    // If primary failed, try alternatives
    if (keywords.length === 0) {
        console.log('  Trying alternative URLs...');
        const alternatives = getAlternativeUrls(version);
        
        for (const url of alternatives) {
            keywords = await fetchKeywordsFromUrl(url, version);
            if (keywords.length > 0) {
                break;
            }
        }
    }
    
    return keywords;
}

/**
 * Update tmLanguage file with keywords from multiple versions
 */
async function updateKeywordsFromVersions(versions) {
    try {
        console.log(`Updating keywords from ${versions.length} FortiOS version(s):`);
        versions.forEach(v => console.log(`  • ${v}`));
        
        const allKeywords = new Set();
        let successCount = 0;
        
        // Fetch keywords from each version
        for (const version of versions) {
            const keywords = await fetchKeywordsForVersion(version);
            if (keywords.length > 0) {
                keywords.forEach(k => allKeywords.add(k));
                successCount++;
            }
        }
        
        if (allKeywords.size === 0) {
            console.error('❌ No keywords found from any version');
            return false;
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`  • Versions checked: ${versions.length}`);
        console.log(`  • Versions with keywords: ${successCount}`);
        console.log(`  • Total unique keywords: ${allKeywords.size}`);
        
        // Sort keywords alphabetically
        const sortedKeywords = Array.from(allKeywords).sort();
        
        // Update tmLanguage file
        if (!updateTmLanguageFile(sortedKeywords)) {
            console.error('❌ Failed to update tmLanguage file');
            return false;
        }
        
        console.log('✅ tmLanguage file updated successfully');
        console.log(`\nKeywords: ${sortedKeywords.join(', ')}`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Update failed:', error.message);
        return false;
    }
}

/**
 * Update the tmLanguage file with new keywords
 */
function updateTmLanguageFile(keywords) {
    try {
        const tmLanguageContent = fs.readFileSync(TMLANGUAGE_FILE, 'utf8');
        const keywordPattern = keywords.join('|');
        const newPattern = `\\\\b(${keywordPattern})\\\\b`;
        
        const updatedContent = tmLanguageContent.replace(
            /"match":\s*"\\\\b\([^)]+\)\\\\b"/,
            `"match": "${newPattern}"`
        );

        if (updatedContent === tmLanguageContent) {
            console.log('ℹ️  No changes needed');
            return true;
        }

        fs.writeFileSync(TMLANGUAGE_FILE, updatedContent, 'utf8');
        console.log(`✓ Updated ${TMLANGUAGE_FILE} with ${keywords.length} keywords`);
        return true;

    } catch (error) {
        console.error('Failed to update tmLanguage file:', error.message);
        return false;
    }
}

/**
 * Main function for standalone usage
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node update-keywords-from-version.js <version1> [version2] ...');
        console.log('Example: node update-keywords-from-version.js 7.6.4 7.4.8 7.2.11');
        process.exit(1);
    }
    
    const success = await updateKeywordsFromVersions(args);
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(error => {
        console.error('Script failed:', error.message);
        process.exit(1);
    });
}

module.exports = { 
    updateKeywordsFromVersions,
    updateTmLanguageFile,
    buildCliReferenceUrl,
    fetchKeywordsForVersion
};