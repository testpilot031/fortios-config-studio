"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const FoldingRangeProvider_1 = require("./providers/FoldingRangeProvider");
const BracketMatchingProvider_1 = require("./providers/BracketMatchingProvider");
const DocumentSymbolProvider_1 = require("./providers/DocumentSymbolProvider");
const CompletionItemProvider_1 = require("./providers/CompletionItemProvider");
const SummaryTreeProvider_1 = require("./providers/SummaryTreeProvider");
const OutlineTreeProvider_1 = require("./providers/OutlineTreeProvider");
const ProfileDefinitionProvider_1 = require("./providers/ProfileDefinitionProvider");
const ProfileReferenceProvider_1 = require("./providers/ProfileReferenceProvider");
const CommentToggle_1 = require("./commands/CommentToggle");
const ShowSummary_1 = require("./commands/ShowSummary");
function activate(context) {
    console.log('FortiOS Configuration Helper is now active!');
    // Register folding range provider
    const foldingProvider = vscode.languages.registerFoldingRangeProvider({ scheme: 'file', language: 'fortios' }, new FoldingRangeProvider_1.FortiOSFoldingRangeProvider());
    // Register bracket matching provider
    const bracketMatchingProvider = vscode.languages.registerDocumentHighlightProvider({ scheme: 'file', language: 'fortios' }, new BracketMatchingProvider_1.FortiOSBracketMatchingProvider());
    // Register document symbol provider
    const documentSymbolProvider = vscode.languages.registerDocumentSymbolProvider({ scheme: 'file', language: 'fortios' }, new DocumentSymbolProvider_1.FortiOSDocumentSymbolProvider());
    // Register completion item provider
    const completionProvider = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'fortios' }, new CompletionItemProvider_1.FortiOSCompletionItemProvider(), ' ', '\n', '\t' // Trigger completion on space, newline, and tab
    );
    // Register profile definition provider (Go to Definition)
    const profileDefinitionProvider = vscode.languages.registerDefinitionProvider({ scheme: 'file', language: 'fortios' }, new ProfileDefinitionProvider_1.FortiOSProfileDefinitionProvider());
    // Register profile reference provider (Find All References)
    const profileReferenceProvider = vscode.languages.registerReferenceProvider({ scheme: 'file', language: 'fortios' }, new ProfileReferenceProvider_1.FortiOSProfileReferenceProvider());
    // Register outline tree view
    const outlineTreeProvider = new OutlineTreeProvider_1.FortiOSOutlineTreeProvider(context);
    const outlineTreeView = vscode.window.createTreeView('fortiosOutline', {
        treeDataProvider: outlineTreeProvider,
        showCollapseAll: true,
        canSelectMany: false
    });
    // Register summary tree view
    const summaryTreeProvider = new SummaryTreeProvider_1.FortiOSSummaryTreeProvider();
    const summaryTreeView = vscode.window.createTreeView('fortiosSummary', {
        treeDataProvider: summaryTreeProvider,
        showCollapseAll: true
    });
    // Register commands
    CommentToggle_1.CommentToggleCommand.register(context);
    ShowSummary_1.ShowSummaryCommand.register(context);
    // Register refresh commands
    const refreshSummaryCommand = vscode.commands.registerCommand('fortios.refreshSummary', () => {
        summaryTreeProvider.refresh();
    });
    const refreshOutlineCommand = vscode.commands.registerCommand('fortios.refreshOutline', () => {
        outlineTreeProvider.refresh();
    });
    // Register jump to line command
    const jumpToLineCommand = vscode.commands.registerCommand('fortios.jumpToLine', (line) => {
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
        let filterText;
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
            const result = await new Promise(resolve => {
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
            if (!result)
                return; // User cancelled
            if (result.label.includes('Enter new filter')) {
                filterText = await vscode.window.showInputBox({
                    prompt: 'Filter Configuration Outline',
                    placeHolder: 'Enter filter text (e.g., system, interface, policy, firewall)',
                    value: outlineTreeProvider.currentFilter
                });
            }
            else {
                filterText = result.description || result.label.replace('$(history) ', '');
            }
        }
        else {
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
        quickPick.onDidChangeSelection(async (items) => {
            const selected = items[0];
            if (!selected || !selected.description)
                return;
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
    context.subscriptions.push(foldingProvider, bracketMatchingProvider, documentSymbolProvider, completionProvider, profileDefinitionProvider, profileReferenceProvider, outlineTreeView, summaryTreeView, refreshSummaryCommand, refreshOutlineCommand, jumpToLineCommand, filterOutlineCommand, clearOutlineFilterCommand, quickFilterCommand);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map