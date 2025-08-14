import * as vscode from 'vscode';
import { FortiOSParser, ConfigBlock } from '../parsers/FortiOSParser';

export class FortiOSDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    private parser: FortiOSParser;

    constructor() {
        this.parser = new FortiOSParser();
    }

    provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.DocumentSymbol[]> {
        const blocks = this.parser.parseDocument(document);
        const ctds = this.convertToDocumentSymbols(document, blocks);

        return ctds;

    }

    private convertToDocumentSymbols(document: vscode.TextDocument, blocks: ConfigBlock[]): vscode.DocumentSymbol[] {
        const symbols: vscode.DocumentSymbol[] = [];
        const sections = this.parser.getConfigSections(blocks);

        // Group blocks by section
        for (const section of sections) {
            const sectionBlocks = this.parser.getBlocksBySection(blocks, section);
            if (sectionBlocks.length === 0) continue;

            const sectionSymbol = new vscode.DocumentSymbol(
                this.getSectionDisplayName(section),
                '',
                this.getSectionSymbolKind(section),
                this.calculateSectionRange(document, sectionBlocks),
                this.calculateSectionSelectionRange(document, sectionBlocks[0])
            );

            // Add individual config blocks as children
            for (const block of sectionBlocks) {
                const blockSymbol = this.createBlockSymbol(document, block);
                sectionSymbol.children.push(blockSymbol);
            }

            symbols.push(sectionSymbol);
        }

        return symbols;
    }

    private createBlockSymbol(document: vscode.TextDocument, block: ConfigBlock): vscode.DocumentSymbol {
        const symbol = new vscode.DocumentSymbol(
            block.name,
            this.getFilterableDescription(block),
            this.getBlockSymbolKind(block),
            new vscode.Range(
                block.startLine,
                0,
                block.endLine >= 0 ? block.endLine : block.startLine,
                document.lineAt(block.endLine >= 0 ? block.endLine : block.startLine).text.length
            ),
            new vscode.Range(
                block.startLine,
                0,
                block.startLine,
                document.lineAt(block.startLine).text.length
            )
        );

        // Add child blocks
        for (const child of block.children) {
            symbol.children.push(this.createBlockSymbol(document, child));
        }

        return symbol;
    }

    private getSectionDisplayName(section: string): string {
        const sectionNames: { [key: string]: string } = {
            'system': '🔧 System Configuration',
            'firewall': '🛡️ Security Configuration',
            'router': '🛣️ Network Configuration',
            'vpn': '🔒 VPN Configuration',
            'user': '👥 User Configuration',
            'log': '📋 Logging Configuration',
            'webfilter': '🌐 Web Filter Configuration',
            'antivirus': '🦠 Antivirus Configuration',
            'ips': '🚨 IPS Configuration'
        };

        return sectionNames[section] || `📁 ${section.charAt(0).toUpperCase() + section.slice(1)} Configuration`;
    }

    private getSectionSymbolKind(section: string): vscode.SymbolKind {
        return vscode.SymbolKind.Namespace;
    }

    private getBlockSymbolKind(block: ConfigBlock): vscode.SymbolKind {
        if (block.type === 'config') {
            const section = block.name.split(' ')[0];
            switch (section) {
                case 'system':
                    return vscode.SymbolKind.Module;
                case 'firewall':
                    return vscode.SymbolKind.Class;
                case 'router':
                    return vscode.SymbolKind.Interface;
                default:
                    return vscode.SymbolKind.Object;
            }
        } else {
            return vscode.SymbolKind.Property;
        }
    }

    private calculateSectionRange(document: vscode.TextDocument, blocks: ConfigBlock[]): vscode.Range {
        if (blocks.length === 0) {
            return new vscode.Range(0, 0, 0, 0);
        }

        const startLine = Math.min(...blocks.map(b => b.startLine));
        const endLine = Math.max(...blocks.map(b => b.endLine >= 0 ? b.endLine : b.startLine));

        return new vscode.Range(
            startLine,
            0,
            endLine,
            document.lineAt(Math.min(endLine, document.lineCount - 1)).text.length
        );
    }

    private calculateSectionSelectionRange(document: vscode.TextDocument, firstBlock: ConfigBlock): vscode.Range {
        return new vscode.Range(
            firstBlock.startLine,
            0,
            firstBlock.startLine,
            document.lineAt(firstBlock.startLine).text.length
        );
    }

    private getFilterableDescription(block: ConfigBlock): string {
        const section = block.name.split(' ')[0];
        const tags: string[] = [];

        // Add category tags for better filtering
        switch (section) {
            case 'system':
                tags.push('#system', '#global', '#hostname');
                break;
            case 'interface':
                tags.push('#interface', '#network', '#port');
                break;
            case 'policy':
                tags.push('#policy', '#firewall', '#rule');
                break;
            case 'address':
                tags.push('#address', '#object', '#ip');
                break;
            case 'service':
                tags.push('#service', '#port', '#protocol');
                break;
            case 'route':
                tags.push('#route', '#routing', '#gateway');
                break;
            case 'user':
                tags.push('#user', '#auth', '#authentication');
                break;
            case 'certificate':
                tags.push('#certificate', '#ssl', '#pki');
                break;
            case 'profile':
                tags.push('#profile', '#security', '#protection');
                break;
            default:
                tags.push(`#${section}`);
        }

        return `${block.fullPath} ${tags.join(' ')}`;
    }
}