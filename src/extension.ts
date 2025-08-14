import * as vscode from 'vscode';
import { FortiOSFoldingRangeProvider } from './providers/FoldingRangeProvider';
import { FortiOSBracketMatchingProvider } from './providers/BracketMatchingProvider';
import { FortiOSDocumentSymbolProvider } from './providers/DocumentSymbolProvider';
import { FortiOSCompletionItemProvider } from './providers/CompletionItemProvider';
import { FortiOSSummaryTreeProvider } from './providers/SummaryTreeProvider';
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

    // Register summary tree view
    const summaryTreeProvider = new FortiOSSummaryTreeProvider();
    const summaryTreeView = vscode.window.createTreeView('fortiosSummary', {
        treeDataProvider: summaryTreeProvider,
        showCollapseAll: true
    });

    // Register commands
    CommentToggleCommand.register(context);
    ShowSummaryCommand.register(context);
    
    // Register refresh summary command
    const refreshSummaryCommand = vscode.commands.registerCommand('fortios.refreshSummary', () => {
        summaryTreeProvider.refresh();
    });

    context.subscriptions.push(
        foldingProvider, 
        bracketMatchingProvider, 
        documentSymbolProvider,
        completionProvider,
        profileDefinitionProvider,
        profileReferenceProvider,
        summaryTreeView,
        refreshSummaryCommand
    );
}

export function deactivate() {}