#!/usr/bin/env node

/**
 * FortiOS CLI keywords auto-updater
 * Fetches the latest config commands from Fortinet documentation
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const FORTIOS_DOCS_URLS = [
    'https://docs.fortinet.com/document/fortigate/7.6.4/cli-reference/84566/fortios-cli-reference',
    'https://docs.fortinet.com/document/fortigate/7.4.8/cli-reference/84566',
    'https://docs.fortinet.com/document/fortigate/7.2.11/cli-reference/708841/cli-configuration-commands'
];

const TMLANGUAGE_FILE = path.join(__dirname, '../syntaxes/fortios.tmLanguage.json');

async function fetchConfigCommands(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // Extract config commands from HTML content
                const configMatches = data.match(/config\s+([a-z-]+)/gi) || [];
                const commands = [...new Set(configMatches.map(match => 
                    match.replace(/^config\s+/i, '').toLowerCase()
                ))];
                resolve(commands);
            });
        }).on('error', reject);
    });
}

async function updateTmLanguageFile() {
    try {
        console.log('Fetching FortiOS CLI commands...');
        
        // Fetch from all versions
        const allCommands = new Set();
        for (const url of FORTIOS_DOCS_URLS) {
            try {
                const commands = await fetchConfigCommands(url);
                commands.forEach(cmd => allCommands.add(cmd));
                console.log(`✓ Fetched ${commands.length} commands from ${url}`);
            } catch (error) {
                console.warn(`⚠ Failed to fetch from ${url}: ${error.message}`);
            }
        }

        if (allCommands.size === 0) {
            throw new Error('No commands fetched from any source');
        }

        // Sort commands alphabetically
        const sortedCommands = [...allCommands].sort();
        console.log(`Found ${sortedCommands.length} unique config commands`);

        // Update tmLanguage file
        const tmLanguageContent = fs.readFileSync(TMLANGUAGE_FILE, 'utf8');
        const keywordPattern = sortedCommands.join('|');
        const newPattern = `\\\\b(${keywordPattern})\\\\b`;
        
        const updatedContent = tmLanguageContent.replace(
            /"match":\s*"\\\\b\([^)]+\)\\\\b"/,
            `"match": "${newPattern}"`
        );

        if (updatedContent === tmLanguageContent) {
            console.log('No changes needed');
            return false;
        }

        fs.writeFileSync(TMLANGUAGE_FILE, updatedContent, 'utf8');
        console.log(`✓ Updated ${TMLANGUAGE_FILE} with ${sortedCommands.length} commands`);
        return true;

    } catch (error) {
        console.error('Failed to update keywords:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    updateTmLanguageFile().then(changed => {
        if (changed) {
            console.log('Keywords updated successfully!');
        } else {
            console.log('Keywords are already up to date');
        }
    });
}

module.exports = { updateTmLanguageFile };