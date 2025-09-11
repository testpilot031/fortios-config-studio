import * as vscode from 'vscode';
import { ConfigAnalyzer } from '../parsers/ConfigAnalyzer';

export class ShowSummaryCommand {
    private static currentPanel: vscode.WebviewPanel | undefined;

    static register(context: vscode.ExtensionContext): void {
        const disposable = vscode.commands.registerCommand('fortios.showConfigurationSummary', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No FortiOS configuration file is currently open.');
                return;
            }

            if (editor.document.languageId !== 'fortios') {
                vscode.window.showWarningMessage('Active file is not a FortiOS configuration file.');
                return;
            }

            // Focus on the FortiOS Summary view instead of opening WebView
            try {
                await vscode.commands.executeCommand('fortiosSummary.focus');
            } catch (error) {
                // Fallback to WebView if TreeView focus fails
                ShowSummaryCommand.createOrShow(context.extensionUri, editor.document);
            }
        });

        context.subscriptions.push(disposable);
    }

    private static createOrShow(extensionUri: vscode.Uri, document: vscode.TextDocument) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (ShowSummaryCommand.currentPanel) {
            ShowSummaryCommand.currentPanel.reveal(column);
            ShowSummaryCommand.updateContent(document);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            'fortiOSSummary',
            'FortiOS Configuration Summary',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );

        ShowSummaryCommand.currentPanel = panel;

        // Set the webview's initial html content
        ShowSummaryCommand.updateContent(document);

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        panel.onDidDispose(() => {
            ShowSummaryCommand.currentPanel = undefined;
        }, null);

        // Update the content based on view changes
        panel.onDidChangeViewState(
            e => {
                if (ShowSummaryCommand.currentPanel?.visible) {
                    ShowSummaryCommand.updateContent(document);
                }
            },
            null
        );
    }

    private static updateContent(document: vscode.TextDocument) {
        if (!ShowSummaryCommand.currentPanel) {
            return;
        }

        const analyzer = new ConfigAnalyzer();
        const summary = analyzer.analyzeDocument(document);
        const summaryText = analyzer.generateSummaryText(summary);

        ShowSummaryCommand.currentPanel.webview.html = ShowSummaryCommand.getWebviewContent(summary, summaryText);
    }

    private static getWebviewContent(summary: any, summaryText: string): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>FortiOS Configuration Summary</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    padding: 20px;
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    line-height: 1.6;
                }
                h1 {
                    color: var(--vscode-textLink-foreground);
                    border-bottom: 2px solid var(--vscode-textLink-foreground);
                    padding-bottom: 10px;
                }
                h2 {
                    color: var(--vscode-textPreformat-foreground);
                    margin-top: 30px;
                }
                .info-card {
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                    border-left: 4px solid var(--vscode-textLink-foreground);
                    padding: 15px;
                    margin: 15px 0;
                    border-radius: 4px;
                }
                .status-high {
                    border-left-color: #f14c4c;
                    background-color: rgba(241, 76, 76, 0.1);
                }
                .status-medium {
                    border-left-color: #ffcc02;
                    background-color: rgba(255, 204, 2, 0.1);
                }
                .status-low {
                    border-left-color: #89d185;
                    background-color: rgba(137, 209, 133, 0.1);
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin: 20px 0;
                }
                .summary-item {
                    background-color: var(--vscode-input-background);
                    padding: 15px;
                    border-radius: 6px;
                    border: 1px solid var(--vscode-input-border);
                }
                .summary-item h3 {
                    margin-top: 0;
                    color: var(--vscode-textLink-foreground);
                }
                .interface-list {
                    font-family: var(--vscode-editor-font-family);
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                }
                pre {
                    background-color: var(--vscode-textCodeBlock-background);
                    padding: 15px;
                    border-radius: 4px;
                    overflow-x: auto;
                    white-space: pre-wrap;
                }
            </style>
        </head>
        <body>
            <h1>🔧 FortiOS Configuration Summary</h1>
            
            <div class="summary-grid">
                <div class="summary-item">
                    <h3>📋 Basic Information</h3>
                    <p><strong>Version:</strong> ${summary.version}</p>
                    <p><strong>Hostname:</strong> ${summary.hostname}</p>
                    <p><strong>Serial:</strong> ${summary.serialNumber}</p>
                </div>

                <div class="summary-item">
                    <h3>🔌 Network Interfaces</h3>
                    <p><strong>Count:</strong> ${summary.interfaces.count} interfaces</p>
                    <div class="interface-list">
                        ${summary.interfaces.configured.map((iface: string) => `<span>${iface}</span>`).join(', ')}
                    </div>
                </div>

                <div class="summary-item">
                    <h3>🛡️ Security Policies</h3>
                    <p><strong>Total Policies:</strong> ${summary.policies.count}</p>
                </div>
            </div>

            <div class="info-card status-${summary.externalAccess.risk}">
                <h3>🚨 External Access Status</h3>
                <p>${summary.externalAccess.description}</p>
                <p><strong>Risk Level:</strong> ${summary.externalAccess.risk.toUpperCase()}</p>
            </div>

            <details>
                <summary><h2>📝 Detailed Analysis</h2></summary>
                <pre>${summaryText}</pre>
            </details>

            <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--vscode-input-border); color: var(--vscode-descriptionForeground); font-size: 0.9em;">
                Last analyzed: ${new Date(summary.lastAnalyzed).toLocaleString()}
            </footer>
        </body>
        </html>`;
    }
}