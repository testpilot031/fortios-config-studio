"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FortiOSDocumentSymbolProvider = void 0;
const vscode = require("vscode");
const FortiOSParser_1 = require("../parsers/FortiOSParser");
class FortiOSDocumentSymbolProvider {
    constructor() {
        this.parser = new FortiOSParser_1.FortiOSParser();
    }
    provideDocumentSymbols(document, token) {
        const blocks = this.parser.parseDocument(document);
        const ctds = this.convertToDocumentSymbols(document, blocks);
        return ctds;
    }
    convertToDocumentSymbols(document, blocks) {
        const symbols = [];
        const sections = this.parser.getConfigSections(blocks);
        // Group blocks by section
        for (const section of sections) {
            const sectionBlocks = this.parser.getBlocksBySection(blocks, section);
            if (sectionBlocks.length === 0)
                continue;
            const sectionSymbol = new vscode.DocumentSymbol(this.getSectionDisplayName(section), '', this.getSectionSymbolKind(section), this.calculateSectionRange(document, sectionBlocks), this.calculateSectionSelectionRange(document, sectionBlocks[0]));
            // Add individual config blocks as children
            for (const block of sectionBlocks) {
                const blockSymbol = this.createBlockSymbol(document, block);
                sectionSymbol.children.push(blockSymbol);
            }
            symbols.push(sectionSymbol);
        }
        return symbols;
    }
    createBlockSymbol(document, block) {
        const symbol = new vscode.DocumentSymbol(block.name, this.getFilterableDescription(block), this.getBlockSymbolKind(block), new vscode.Range(block.startLine, 0, block.endLine >= 0 ? block.endLine : block.startLine, document.lineAt(block.endLine >= 0 ? block.endLine : block.startLine).text.length), new vscode.Range(block.startLine, 0, block.startLine, document.lineAt(block.startLine).text.length));
        // Add child blocks
        for (const child of block.children) {
            symbol.children.push(this.createBlockSymbol(document, child));
        }
        return symbol;
    }
    getSectionDisplayName(section) {
        const sectionNames = {
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
    getSectionSymbolKind(section) {
        return vscode.SymbolKind.Namespace;
    }
    getBlockSymbolKind(block) {
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
        }
        else {
            return vscode.SymbolKind.Property;
        }
    }
    calculateSectionRange(document, blocks) {
        if (blocks.length === 0) {
            return new vscode.Range(0, 0, 0, 0);
        }
        const startLine = Math.min(...blocks.map(b => b.startLine));
        const endLine = Math.max(...blocks.map(b => b.endLine >= 0 ? b.endLine : b.startLine));
        return new vscode.Range(startLine, 0, endLine, document.lineAt(Math.min(endLine, document.lineCount - 1)).text.length);
    }
    calculateSectionSelectionRange(document, firstBlock) {
        return new vscode.Range(firstBlock.startLine, 0, firstBlock.startLine, document.lineAt(firstBlock.startLine).text.length);
    }
    getFilterableDescription(block) {
        const section = block.name.split(' ')[0];
        const tags = [];
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
exports.FortiOSDocumentSymbolProvider = FortiOSDocumentSymbolProvider;
//# sourceMappingURL=DocumentSymbolProvider.js.map