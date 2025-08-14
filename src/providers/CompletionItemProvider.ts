import * as vscode from 'vscode';
import { FortiOSParser } from '../parsers/FortiOSParser';
import { FORTIOS_COMMANDS, CONFIG_BLOCKS } from '../data/commands';

export class FortiOSCompletionItemProvider implements vscode.CompletionItemProvider {
    private parser: FortiOSParser;

    constructor() {
        this.parser = new FortiOSParser();
    }

    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        const line = document.lineAt(position);
        const lineText = line.text.substring(0, position.character);
        
        // Get current configuration context
        const currentContext = this.getCurrentContext(document, position);
        
        // Determine what type of completion to provide
        if (lineText.trim() === '' || lineText.match(/^\s*$/)) {
            // Start of line - suggest config blocks or commands based on context
            return this.provideStartOfLineCompletions(currentContext);
        } else if (lineText.endsWith('config ')) {
            // After "config" - suggest configuration sections
            return this.provideConfigSectionCompletions();
        } else if (lineText.match(/^\s*set\s+\w*$/)) {
            // After "set" - suggest commands for current context
            return this.provideSetCommandCompletions(currentContext);
        } else if (lineText.match(/^\s*edit\s+$/)) {
            // After "edit" - suggest edit targets based on context
            return this.provideEditCompletions(currentContext);
        }

        return [];
    }

    private getCurrentContext(document: vscode.TextDocument, position: vscode.Position): string[] {
        const context: string[] = [];
        const blocks = this.parser.parseDocument(document);
        
        // Find which config blocks contain the current position
        const findContext = (blocks: any[], path: string[] = []) => {
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

    private provideStartOfLineCompletions(context: string[]): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        
        if (context.length === 0) {
            // At root level - suggest top-level config blocks
            completions.push(
                this.createCompletionItem('config', 'Start configuration block', vscode.CompletionItemKind.Keyword),
                this.createCompletionItem('end', 'End configuration block', vscode.CompletionItemKind.Keyword)
            );
        } else {
            // Inside a config block - suggest appropriate commands
            completions.push(
                this.createCompletionItem('set', 'Set configuration parameter', vscode.CompletionItemKind.Keyword),
                this.createCompletionItem('unset', 'Unset configuration parameter', vscode.CompletionItemKind.Keyword),
                this.createCompletionItem('edit', 'Edit configuration item', vscode.CompletionItemKind.Keyword),
                this.createCompletionItem('config', 'Start nested configuration', vscode.CompletionItemKind.Keyword),
                this.createCompletionItem('end', 'End configuration block', vscode.CompletionItemKind.Keyword),
                this.createCompletionItem('next', 'Next configuration item', vscode.CompletionItemKind.Keyword)
            );
        }
        
        return completions;
    }

    private provideConfigSectionCompletions(): vscode.CompletionItem[] {
        return CONFIG_BLOCKS.map(block => {
            const sectionName = block.replace('config ', '');
            return this.createCompletionItem(
                sectionName,
                `Configure ${sectionName}`,
                vscode.CompletionItemKind.Module
            );
        });
    }

    private provideSetCommandCompletions(context: string[]): vscode.CompletionItem[] {
        const contextString = context.join(' ');
        
        return FORTIOS_COMMANDS
            .filter(cmd => cmd.context.some(ctx => contextString.includes(ctx)))
            .map(cmd => {
                const item = this.createCompletionItem(
                    cmd.command.replace('set ', ''),
                    cmd.description,
                    vscode.CompletionItemKind.Property
                );
                
                // Add parameter suggestions if available
                if (cmd.parameters && cmd.parameters.length > 0) {
                    item.detail = `Parameters: ${cmd.parameters.join(', ')}`;
                }
                
                return item;
            });
    }

    private provideEditCompletions(context: string[]): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        
        // Suggest common edit targets based on context
        if (context.some(ctx => ctx.includes('interface'))) {
            ['port1', 'port2', 'port3', 'port4', 'wan1', 'wan2', 'internal'].forEach(iface => {
                completions.push(this.createCompletionItem(
                    `"${iface}"`,
                    `Edit interface ${iface}`,
                    vscode.CompletionItemKind.Interface
                ));
            });
        } else if (context.some(ctx => ctx.includes('policy'))) {
            // Suggest policy numbers
            for (let i = 1; i <= 10; i++) {
                completions.push(this.createCompletionItem(
                    i.toString(),
                    `Edit policy ${i}`,
                    vscode.CompletionItemKind.Value
                ));
            }
        } else if (context.some(ctx => ctx.includes('address'))) {
            completions.push(this.createCompletionItem(
                '"new-address"',
                'Create new address object',
                vscode.CompletionItemKind.Value
            ));
        }
        
        return completions;
    }

    private createCompletionItem(
        label: string,
        detail: string,
        kind: vscode.CompletionItemKind
    ): vscode.CompletionItem {
        const item = new vscode.CompletionItem(label, kind);
        item.detail = detail;
        item.insertText = label;
        return item;
    }
}