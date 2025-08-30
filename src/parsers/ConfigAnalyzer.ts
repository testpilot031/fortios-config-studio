import * as vscode from 'vscode';
import { FortiOSParser, ConfigBlock } from './FortiOSParser';

export interface ConfigSummary {
    version: string;
    buildno: string;
    deviceModel: string;
    hostname: string;
    serialNumber: string;
    externalAccess: {
        status: 'enabled' | 'disabled' | 'unknown';
        risk: 'low' | 'medium' | 'high';
        description: string;
    };
    interfaces: {
        count: number;
        configured: string[];
    };
    policies: {
        count: number;
        allowAll: number;
        denyAll: number;
    };
    lastAnalyzed: string;
}

export class ConfigAnalyzer {
    private parser: FortiOSParser;

    constructor() {
        this.parser = new FortiOSParser();
    }

    public analyzeDocument(document: vscode.TextDocument): ConfigSummary {
        const text = document.getText();
        const blocks = this.parser.parseDocument(document);

        return {
            version: this.extractVersion(text),
            buildno: this.extractBuildno(text),
            deviceModel: this.extractDeviceModel(text),
            hostname: this.extractHostname(text),
            serialNumber: this.extractSerialNumber(text),
            externalAccess: this.analyzeExternalAccess(text, blocks),
            interfaces: this.analyzeInterfaces(blocks),
            policies: this.analyzePolicies(blocks),
            lastAnalyzed: new Date().toISOString()
        };
    }

    private extractVersion(text: string): string {
        const versionMatch = text.match(/#config-version=(.+)/);
        if (versionMatch) {
            const version = versionMatch[1];
            // Extract FortiOS version from build string (e.g., "FG60E-7.04.0-FW-build1637" -> "7.04.0")
            const versionParts = version.match(/(\d+\.\d+\.\d+)/);
            return versionParts ? `FortiOS ${versionParts[1]}` : version;
        }
        return 'Unknown';
    }

    private extractBuildno(text: string): string {
        const buildnoMatch = text.match(/#buildno=(\d+)/);
        return buildnoMatch ? buildnoMatch[1] : 'Unknown';
    }

    private extractDeviceModel(text: string): string {
        const configVersionMatch = text.match(/#config-version=([^-]+)/);
        return configVersionMatch ? configVersionMatch[1] : 'Unknown';
    }

    private extractHostname(text: string): string {
        const hostnameMatch = text.match(/set hostname\s+"?([^"\n]+)"?/);
        return hostnameMatch ? hostnameMatch[1].replace(/"/g, '') : 'Unknown';
    }

    private extractSerialNumber(text: string): string {
        const serialMatch = text.match(/#Serial-Number:\s*([^\n]+)/);
        return serialMatch ? serialMatch[1].trim() : 'Unknown';
    }

    private analyzeExternalAccess(text: string, blocks: ConfigBlock[]): ConfigSummary['externalAccess'] {
        // Check for firewall policies that allow external access
        const allowPolicies = text.match(/set action accept/g);
        const anyPolicies = text.match(/set srcaddr "all"/g) && text.match(/set dstaddr "all"/g);
        
        if (allowPolicies && anyPolicies) {
            return {
                status: 'enabled',
                risk: 'high',
                description: '🔴 External access policies detected'
            };
        } else if (allowPolicies) {
            return {
                status: 'enabled',
                risk: 'medium',
                description: '🟡 Limited external access configured'
            };
        } else {
            return {
                status: 'disabled',
                risk: 'low',
                description: '🟢 No external access policies found'
            };
        }
    }

    private analyzeInterfaces(blocks: ConfigBlock[]): ConfigSummary['interfaces'] {
        const interfaces: string[] = [];

        const findInterfaces = (blocks: ConfigBlock[]) => {
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

    private analyzePolicies(blocks: ConfigBlock[]): ConfigSummary['policies'] {
        let totalPolicies = 0;
        let allowAll = 0;
        let denyAll = 0;

        const findPolicies = (blocks: ConfigBlock[]) => {
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
            allowAll: 0, // Would need deeper content analysis
            denyAll: 0   // Would need deeper content analysis
        };
    }

    public generateSummaryText(summary: ConfigSummary): string {
        return `
# FortiOS Configuration Summary

## Basic Information
- **Device Model**: ${summary.deviceModel}
- **Version**: ${summary.version}
- **Build Number**: ${summary.buildno}
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