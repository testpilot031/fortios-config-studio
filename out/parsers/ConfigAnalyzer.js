"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigAnalyzer = void 0;
const FortiOSParser_1 = require("./FortiOSParser");
class ConfigAnalyzer {
    constructor() {
        this.parser = new FortiOSParser_1.FortiOSParser();
    }
    analyzeDocument(document) {
        const text = document.getText();
        const blocks = this.parser.parseDocument(document);
        return {
            version: this.extractVersion(text),
            hostname: this.extractHostname(text),
            serialNumber: this.extractSerialNumber(text),
            externalAccess: this.analyzeExternalAccess(text, blocks),
            interfaces: this.analyzeInterfaces(blocks),
            policies: this.analyzePolicies(blocks),
            lastAnalyzed: new Date().toISOString()
        };
    }
    extractVersion(text) {
        const versionMatch = text.match(/#config-version=(.+)/);
        if (versionMatch) {
            const version = versionMatch[1];
            // Extract FortiOS version from build string (e.g., "FG60E-7.04.0-FW-build1637" -> "7.04.0")
            const versionParts = version.match(/(\d+\.\d+\.\d+)/);
            return versionParts ? `FortiOS ${versionParts[1]}` : version;
        }
        return 'Unknown';
    }
    extractHostname(text) {
        const hostnameMatch = text.match(/set hostname\s+"?([^"\n]+)"?/);
        return hostnameMatch ? hostnameMatch[1].replace(/"/g, '') : 'Unknown';
    }
    extractSerialNumber(text) {
        const serialMatch = text.match(/#Serial-Number:\s*([^\n]+)/);
        return serialMatch ? serialMatch[1].trim() : 'Unknown';
    }
    analyzeExternalAccess(text, blocks) {
        // Check for firewall policies that allow external access
        const allowPolicies = text.match(/set action accept/g);
        const anyPolicies = text.match(/set srcaddr "all"/g) && text.match(/set dstaddr "all"/g);
        if (allowPolicies && anyPolicies) {
            return {
                status: 'enabled',
                risk: 'high',
                description: '🔴 External access policies detected'
            };
        }
        else if (allowPolicies) {
            return {
                status: 'enabled',
                risk: 'medium',
                description: '🟡 Limited external access configured'
            };
        }
        else {
            return {
                status: 'disabled',
                risk: 'low',
                description: '🟢 No external access policies found'
            };
        }
    }
    analyzeInterfaces(blocks) {
        const interfaces = [];
        const findInterfaces = (blocks) => {
            for (const block of blocks) {
                if (block.type === 'config' && block.name === 'system interface') {
                    for (const child of block.children) {
                        if (child.type === 'edit') {
                            interfaces.push(child.name);
                        }
                    }
                }
                if (block.children.length > 0) {
                    findInterfaces(block.children);
                }
            }
        };
        findInterfaces(blocks);
        return {
            count: interfaces.length,
            configured: interfaces
        };
    }
    analyzePolicies(blocks) {
        let totalPolicies = 0;
        let allowAll = 0;
        let denyAll = 0;
        const findPolicies = (blocks) => {
            for (const block of blocks) {
                if (block.type === 'config' && block.name === 'firewall policy') {
                    totalPolicies = block.children.length;
                    // Note: More detailed analysis would require parsing the content of each policy
                    // For now, we'll provide basic counts
                }
                if (block.children.length > 0) {
                    findPolicies(block.children);
                }
            }
        };
        findPolicies(blocks);
        return {
            count: totalPolicies,
            allowAll: 0,
            denyAll: 0 // Would need deeper content analysis
        };
    }
    generateSummaryText(summary) {
        return `
# FortiOS Configuration Summary

## Basic Information
- **Version**: ${summary.version}
- **Hostname**: ${summary.hostname}
- **Serial Number**: ${summary.serialNumber}

## Network Configuration
- **Interfaces**: 🔌 ${summary.interfaces.count} interfaces configured
  - ${summary.interfaces.configured.join(', ')}

## Security Status
- **External Access**: ${summary.externalAccess.description}
- **Firewall Policies**: 🛡️ ${summary.policies.count} policies defined

## Analysis
Last analyzed: ${new Date(summary.lastAnalyzed).toLocaleString()}
        `.trim();
    }
}
exports.ConfigAnalyzer = ConfigAnalyzer;
//# sourceMappingURL=ConfigAnalyzer.js.map