#!/usr/bin/env node

/**
 * Manual FortiOS keywords updater
 * Updates keywords from a predefined list or user input
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const TMLANGUAGE_FILE = path.join(__dirname, '../syntaxes/fortios.tmLanguage.json');

// Known keywords from multiple FortiOS versions
const KNOWN_KEYWORDS = [
    'alertemail', 'antivirus', 'application', 'authentication', 'automation',
    'aws', 'azure', 'casb', 'certificate', 'diameter-filter', 'dlp',
    'dnsfilter', 'dpdk', 'emailfilter', 'endpoint-control', 'ethernet-oam',
    'extension-controller', 'file-filter', 'firewall', 'ftp-proxy', 'icap',
    'ips', 'log', 'monitoring', 'nsxt', 'report', 'router', 'rule',
    'sctp-filter', 'ssh-filter', 'switch-controller', 'system', 'user',
    'videofilter', 'virtual-patch', 'voip', 'vpn', 'waf', 'wanopt',
    'web-proxy', 'webfilter', 'wireless-controller'
];

function updateKeywords(keywords) {
    try {
        const tmLanguageContent = fs.readFileSync(TMLANGUAGE_FILE, 'utf8');
        const keywordPattern = keywords.join('|');
        const newPattern = `\\\\b(${keywordPattern})\\\\b`;
        
        const updatedContent = tmLanguageContent.replace(
            /"match":\s*"\\\\b\([^)]+\)\\\\b"/,
            `"match": "${newPattern}"`
        );

        fs.writeFileSync(TMLANGUAGE_FILE, updatedContent, 'utf8');
        console.log(`✓ Updated with ${keywords.length} keywords`);
        console.log('Keywords:', keywords.join(', '));
        
    } catch (error) {
        console.error('Failed to update:', error.message);
        process.exit(1);
    }
}

async function promptForKeywords() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        console.log('Current keywords:', KNOWN_KEYWORDS.join(', '));
        console.log('\nOptions:');
        console.log('1. Use current known keywords (recommended)');
        console.log('2. Add custom keywords (comma-separated)');
        console.log('3. Replace with custom keywords');
        
        rl.question('\nChoose option (1-3): ', (option) => {
            switch(option) {
                case '1':
                    resolve(KNOWN_KEYWORDS);
                    break;
                    
                case '2':
                    rl.question('Enter additional keywords (comma-separated): ', (input) => {
                        const additionalKeywords = input.split(',').map(k => k.trim()).filter(k => k);
                        const allKeywords = [...new Set([...KNOWN_KEYWORDS, ...additionalKeywords])].sort();
                        resolve(allKeywords);
                    });
                    break;
                    
                case '3':
                    rl.question('Enter all keywords (comma-separated): ', (input) => {
                        const customKeywords = input.split(',').map(k => k.trim()).filter(k => k);
                        resolve(customKeywords.sort());
                    });
                    break;
                    
                default:
                    console.log('Using default keywords');
                    resolve(KNOWN_KEYWORDS);
            }
            rl.close();
        });
    });
}

async function main() {
    console.log('FortiOS Keywords Manual Updater');
    console.log('=================================');
    
    const keywords = await promptForKeywords();
    updateKeywords(keywords);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { updateKeywords, KNOWN_KEYWORDS };