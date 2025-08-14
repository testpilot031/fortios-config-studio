"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FortiOSCompletionItemProvider = void 0;
const vscode = require("vscode");
const FortiOSParser_1 = require("../parsers/FortiOSParser");
const commands_1 = require("../data/commands");
class FortiOSCompletionItemProvider {
    constructor() {
        this.parser = new FortiOSParser_1.FortiOSParser();
    }
    provideCompletionItems(document, position, token, context) {
        const line = document.lineAt(position);
        const lineText = line.text.substring(0, position.character);
        // Get current configuration context
        const currentContext = this.getCurrentContext(document, position);
        // Determine what type of completion to provide
        if (lineText.trim() === '' || lineText.match(/^\s*$/)) {
            // Start of line - suggest config blocks or commands based on context
            return this.provideStartOfLineCompletions(currentContext);
        }
        else if (lineText.endsWith('config ')) {
            // After "config" - suggest configuration sections
            return this.provideConfigSectionCompletions();
        }
        else if (lineText.match(/^\s*set\s+\w*$/)) {
            // After "set" - suggest commands for current context
            return this.provideSetCommandCompletions(currentContext);
        }
        else if (lineText.match(/^\s*edit\s+$/)) {
            // After "edit" - suggest edit targets based on context
            return this.provideEditCompletions(currentContext);
        }
        return [];
    }
    getCurrentContext(document, position) {
        const context = [];
        const blocks = this.parser.parseDocument(document);
        // Find which config blocks contain the current position
        const findContext = (blocks, path = []) => {
            for (const block of blocks) {
                if (position.line >= block.startLine &&
                    (block.endLine === -1 || position.line <= block.endLine)) {
                    const currentPath = [...path, block.name];
                    context.push(...currentPath);
                    if (block.children && block.children.length > 0) {
                        findContext(block.children, currentPath);
                    }
                    break;
                }
            }
        };
        findContext(blocks);
        return context;
    }
    provideStartOfLineCompletions(context) {
        const completions = [];
        if (context.length === 0) {
            // At root level - suggest top-level config blocks
            completions.push(this.createCompletionItem('config', 'Start configuration block', vscode.CompletionItemKind.Keyword), this.createCompletionItem('end', 'End configuration block', vscode.CompletionItemKind.Keyword));
        }
        else {
            // Inside a config block - suggest appropriate commands
            completions.push(this.createCompletionItem('set', 'Set configuration parameter', vscode.CompletionItemKind.Keyword), this.createCompletionItem('unset', 'Unset configuration parameter', vscode.CompletionItemKind.Keyword), this.createCompletionItem('edit', 'Edit configuration item', vscode.CompletionItemKind.Keyword), this.createCompletionItem('config', 'Start nested configuration', vscode.CompletionItemKind.Keyword), this.createCompletionItem('end', 'End configuration block', vscode.CompletionItemKind.Keyword), this.createCompletionItem('next', 'Next configuration item', vscode.CompletionItemKind.Keyword));
        }
        return completions;
    }
    provideConfigSectionCompletions() {
        return commands_1.CONFIG_BLOCKS.map(block => {
            const sectionName = block.replace('config ', '');
            return this.createCompletionItem(sectionName, `Configure ${sectionName}`, vscode.CompletionItemKind.Module);
        });
    }
    provideSetCommandCompletions(context) {
        const contextString = context.join(' ');
        return commands_1.FORTIOS_COMMANDS
            .filter(cmd => cmd.context.some(ctx => contextString.includes(ctx)))
            .map(cmd => {
            const item = this.createCompletionItem(cmd.command.replace('set ', ''), cmd.description, vscode.CompletionItemKind.Property);
            // Add parameter suggestions if available
            if (cmd.parameters && cmd.parameters.length > 0) {
                item.detail = `Parameters: ${cmd.parameters.join(', ')}`;
            }
            return item;
        });
    }
    provideEditCompletions(context) {
        const completions = [];
        // Suggest common edit targets based on context
        if (context.some(ctx => ctx.includes('interface'))) {
            ['port1', 'port2', 'port3', 'port4', 'wan1', 'wan2', 'internal'].forEach(iface => {
                completions.push(this.createCompletionItem(`"${iface}"`, `Edit interface ${iface}`, vscode.CompletionItemKind.Interface));
            });
        }
        else if (context.some(ctx => ctx.includes('policy'))) {
            // Suggest policy numbers
            for (let i = 1; i <= 10; i++) {
                completions.push(this.createCompletionItem(i.toString(), `Edit policy ${i}`, vscode.CompletionItemKind.Value));
            }
        }
        else if (context.some(ctx => ctx.includes('address'))) {
            completions.push(this.createCompletionItem('"new-address"', 'Create new address object', vscode.CompletionItemKind.Value));
        }
        return completions;
    }
    createCompletionItem(label, detail, kind) {
        const item = new vscode.CompletionItem(label, kind);
        item.detail = detail;
        item.insertText = label;
        return item;
    }
}
exports.FortiOSCompletionItemProvider = FortiOSCompletionItemProvider;
//# sourceMappingURL=CompletionItemProvider.js.map