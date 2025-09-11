import * as vscode from 'vscode';
import { FortiOSFoldingRangeProvider } from './providers/FoldingRangeProvider';
import { FortiOSBracketMatchingProvider } from './providers/BracketMatchingProvider';
import { FortiOSDocumentSymbolProvider } from './providers/DocumentSymbolProvider';
import { FortiOSCompletionItemProvider } from './providers/CompletionItemProvider';
import { FortiOSSummaryTreeProvider } from './providers/SummaryTreeProvider';
import { FortiOSOutlineTreeProvider } from './providers/OutlineTreeProvider';
import { FortiOSProfileDefinitionProvider } from './providers/ProfileDefinitionProvider';
import { FortiOSProfileReferenceProvider } from './providers/ProfileReferenceProvider';
import { CommentToggleCommand } from './commands/CommentToggle';
import { ShowSummaryCommand } from './commands/ShowSummary';

export function activate(context: vscode.ExtensionContext) {
    console.log('FortiOS Configuration Helper is now active!');

    // Register folding range provider
    const foldingProvider = vscode.languages.registerFoldingRangeProvider(
        { scheme: 'file', language: 'fortios' },
        new FortiOSFoldingRangeProvider()
    );

    // Register bracket matching provider
    const bracketMatchingProvider = vscode.languages.registerDocumentHighlightProvider(
        { scheme: 'file', language: 'fortios' },
        new FortiOSBracketMatchingProvider()
    );

    // Register document symbol provider
    const documentSymbolProvider = vscode.languages.registerDocumentSymbolProvider(
        { scheme: 'file', language: 'fortios' },
        new FortiOSDocumentSymbolProvider()
    );

    // Register completion item provider
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', language: 'fortios' },
        new FortiOSCompletionItemProvider(),
        ' ', '\n', '\t' // Trigger completion on space, newline, and tab
    );

    // Register profile definition provider (Go to Definition)
    const profileDefinitionProvider = vscode.languages.registerDefinitionProvider(
        { scheme: 'file', language: 'fortios' },
        new FortiOSProfileDefinitionProvider()
    );

    // Register profile reference provider (Find All References)
    const profileReferenceProvider = vscode.languages.registerReferenceProvider(
        { scheme: 'file', language: 'fortios' },
        new FortiOSProfileReferenceProvider()
    );

    // Register outline tree view
    const outlineTreeProvider = new FortiOSOutlineTreeProvider(context);
    const outlineTreeView = vscode.window.createTreeView('fortiosOutline', {
        treeDataProvider: outlineTreeProvider,
        showCollapseAll: true,
        canSelectMany: false
    });

    // Register summary tree view
    const summaryTreeProvider = new FortiOSSummaryTreeProvider();
    const summaryTreeView = vscode.window.createTreeView('fortiosSummary', {
        treeDataProvider: summaryTreeProvider,
        showCollapseAll: true
    });

    // Register commands
    CommentToggleCommand.register(context);
    ShowSummaryCommand.register(context);
    
    // Register refresh commands
    const refreshSummaryCommand = vscode.commands.registerCommand('fortios.refreshSummary', () => {
        summaryTreeProvider.refresh();
    });

    const refreshOutlineCommand = vscode.commands.registerCommand('fortios.refreshOutline', () => {
        outlineTreeProvider.refresh();
    });

    // Register jump to line command
    const jumpToLineCommand = vscode.commands.registerCommand('fortios.jumpToLine', (line: number) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && line >= 0) {
            const position = new vscode.Position(line, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
            vscode.window.showTextDocument(editor.document);
        }
    });

    // Register filter outline command (with history suggestions)
    const filterOutlineCommand = vscode.commands.registerCommand('fortios.filterOutline', async () => {
        const filterHistory = outlineTreeProvider.getFilterHistory();
        const recentFilters = filterHistory.getHistory();
        
        let filterText: string | undefined;
        
        // Show QuickPick if history exists, otherwise show InputBox
        if (recentFilters.length > 0) {
            const quickPick = vscode.window.createQuickPick();
            quickPick.items = [
                {
                    label: '$(edit) Enter new filter...',
                    detail: 'Type custom search text',
                    alwaysShow: true
                },
                ...recentFilters.slice(0, 8).map(filter => ({
                    label: `$(history) ${filter}`,
                    detail: 'Recent search',
                    description: filter
                }))
            ];
            quickPick.placeholder = 'Select recent filter or enter new search';
            quickPick.canSelectMany = false;

            const result = await new Promise<vscode.QuickPickItem | undefined>(resolve => {
                quickPick.onDidChangeSelection(items => {
                    resolve(items[0]);
                    quickPick.dispose();
                });
                quickPick.onDidHide(() => {
                    resolve(undefined);
                    quickPick.dispose();
                });
                quickPick.show();
            });

            if (!result) return; // User cancelled
            
            if (result.label.includes('Enter new filter')) {
                filterText = await vscode.window.showInputBox({
                    prompt: 'Filter Configuration Outline',
                    placeHolder: 'Enter filter text (e.g., system, interface, policy, firewall)',
                    value: outlineTreeProvider.currentFilter
                });
            } else {
                filterText = result.description || result.label.replace('$(history) ', '');
            }
        } else {
            // No history, show InputBox directly
            filterText = await vscode.window.showInputBox({
                prompt: 'Filter Configuration Outline',
                placeHolder: 'Enter filter text (e.g., system, interface, policy, firewall)',
                value: outlineTreeProvider.currentFilter
            });
        }
        
        if (filterText !== undefined) {
            outlineTreeProvider.applyFilter(filterText);
        }
    });

    // Register clear filter command
    const clearOutlineFilterCommand = vscode.commands.registerCommand('fortios.clearOutlineFilter', () => {
        outlineTreeProvider.applyFilter('');
        vscode.window.showInformationMessage('Configuration Outline filter cleared');
    });

    // Register quick filter command with presets and history
    const quickFilterCommand = vscode.commands.registerCommand('fortios.quickFilter', async () => {
        const filterHistory = outlineTreeProvider.getFilterHistory();
        const quickPickItems = filterHistory.getAllQuickPickItems();
        
        if (quickPickItems.length === 0) {
            vscode.window.showInformationMessage('No filter history or presets available');
            return;
        }

        const quickPick = vscode.window.createQuickPick();
        quickPick.items = quickPickItems;
        quickPick.placeholder = 'Select a filter preset or recent search';
        quickPick.matchOnDescription = true;
        quickPick.matchOnDetail = true;

        quickPick.onDidChangeSelection(async items => {
            const selected = items[0];
            if (!selected || !selected.description) return;

            switch (selected.description) {
                case 'custom':
                    const customFilter = await vscode.window.showInputBox({
                        prompt: 'Enter custom filter text',
                        placeHolder: 'system, interface, policy, etc.',
                        value: outlineTreeProvider.currentFilter
                    });
                    if (customFilter !== undefined) {
                        outlineTreeProvider.applyFilter(customFilter);
                    }
                    break;
                
                case 'clear':
                    outlineTreeProvider.applyFilter('');
                    vscode.window.showInformationMessage('Configuration Outline filter cleared');
                    break;
                
                default:
                    // Apply the filter (either from history or preset)
                    outlineTreeProvider.applyFilter(selected.description);
                    break;
            }
            quickPick.dispose();
        });

        quickPick.onDidHide(() => {
            quickPick.dispose();
        });

        quickPick.show();
    });

    context.subscriptions.push(
        foldingProvider, 
        bracketMatchingProvider, 
        documentSymbolProvider,
        completionProvider,
        profileDefinitionProvider,
        profileReferenceProvider,
        outlineTreeView,
        summaryTreeView,
        refreshSummaryCommand,
        refreshOutlineCommand,
        jumpToLineCommand,
        filterOutlineCommand,
        clearOutlineFilterCommand,
        quickFilterCommand
    );
}

export function deactivate() {}