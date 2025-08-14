"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const FoldingRangeProvider_1 = require("./providers/FoldingRangeProvider");
const BracketMatchingProvider_1 = require("./providers/BracketMatchingProvider");
const DocumentSymbolProvider_1 = require("./providers/DocumentSymbolProvider");
const CompletionItemProvider_1 = require("./providers/CompletionItemProvider");
const SummaryTreeProvider_1 = require("./providers/SummaryTreeProvider");
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
    // Register summary tree view
    const summaryTreeProvider = new SummaryTreeProvider_1.FortiOSSummaryTreeProvider();
    const summaryTreeView = vscode.window.createTreeView('fortiosSummary', {
        treeDataProvider: summaryTreeProvider,
        showCollapseAll: true
    });
    // Register commands
    CommentToggle_1.CommentToggleCommand.register(context);
    ShowSummary_1.ShowSummaryCommand.register(context);
    // Register refresh summary command
    const refreshSummaryCommand = vscode.commands.registerCommand('fortios.refreshSummary', () => {
        summaryTreeProvider.refresh();
    });
    context.subscriptions.push(foldingProvider, bracketMatchingProvider, documentSymbolProvider, completionProvider, profileDefinitionProvider, profileReferenceProvider, summaryTreeView, refreshSummaryCommand);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map