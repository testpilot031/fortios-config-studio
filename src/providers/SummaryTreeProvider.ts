import * as vscode from 'vscode';
import { ConfigAnalyzer } from '../parsers/ConfigAnalyzer';

export class SummaryTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly value?: string,
        public readonly iconPath?: vscode.ThemeIcon | string,
        public readonly contextValue?: string
    ) {
        super(label, collapsibleState);
        
        if (value) {
            this.description = value;
        }
        
        if (iconPath) {
            this.iconPath = iconPath;
        }

        if (contextValue) {
            this.contextValue = contextValue;
        }
    }
}

export class FortiOSSummaryTreeProvider implements vscode.TreeDataProvider<SummaryTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SummaryTreeItem | undefined | null | void> = new vscode.EventEmitter<SummaryTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SummaryTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private analyzer: ConfigAnalyzer;
    private currentDocument: vscode.TextDocument | undefined;

    constructor() {
        this.analyzer = new ConfigAnalyzer();
        
        // Listen for active editor changes
        vscode.window.onDidChangeActiveTextEditor(() => {
            this.refresh();
        });

        // Listen for document changes
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document === this.currentDocument) {
                this.refresh();
            }
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SummaryTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SummaryTreeItem): Thenable<SummaryTreeItem[]> {
        if (!element) {
            return Promise.resolve(this.getRootItems());
        }
        
        return Promise.resolve(this.getChildItems(element));
    }

    private getRootItems(): SummaryTreeItem[] {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor || editor.document.languageId !== 'fortios') {
            return [
                new SummaryTreeItem(
                    'No FortiOS configuration file open',
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('info')
                )
            ];
        }

        this.currentDocument = editor.document;
        const summary = this.analyzer.analyzeDocument(editor.document);

        return [
            new SummaryTreeItem(
                'Basic Information',
                vscode.TreeItemCollapsibleState.Expanded,
                undefined,
                new vscode.ThemeIcon('info'),
                'basicInfo'
            ),
            new SummaryTreeItem(
                'Network Interfaces',
                vscode.TreeItemCollapsibleState.Expanded,
                `${summary.interfaces.count} interfaces`,
                new vscode.ThemeIcon('plug'),
                'interfaces'
            ),
            new SummaryTreeItem(
                'Security Policies',
                vscode.TreeItemCollapsibleState.Expanded,
                `${summary.policies.count} policies`,
                new vscode.ThemeIcon('shield'),
                'policies'
            ),
            new SummaryTreeItem(
                'External Access',
                vscode.TreeItemCollapsibleState.Expanded,
                summary.externalAccess.risk.toUpperCase(),
                this.getRiskIcon(summary.externalAccess.risk),
                'externalAccess'
            )
        ];
    }

    private getChildItems(element: SummaryTreeItem): SummaryTreeItem[] {
        if (!this.currentDocument) {
            return [];
        }

        const summary = this.analyzer.analyzeDocument(this.currentDocument);

        switch (element.contextValue) {
            case 'basicInfo':
                return [
                    new SummaryTreeItem(
                        'Version',
                        vscode.TreeItemCollapsibleState.None,
                        summary.version,
                        new vscode.ThemeIcon('versions')
                    ),
                    new SummaryTreeItem(
                        'Hostname',
                        vscode.TreeItemCollapsibleState.None,
                        summary.hostname,
                        new vscode.ThemeIcon('device-desktop')
                    ),
                    new SummaryTreeItem(
                        'Serial Number',
                        vscode.TreeItemCollapsibleState.None,
                        summary.serialNumber,
                        new vscode.ThemeIcon('key')
                    )
                ];

            case 'interfaces':
                return summary.interfaces.configured.map((iface: string) => 
                    new SummaryTreeItem(
                        iface,
                        vscode.TreeItemCollapsibleState.None,
                        undefined,
                        new vscode.ThemeIcon('symbol-interface')
                    )
                );

            case 'policies':
                if (summary.policies.count === 0) {
                    return [
                        new SummaryTreeItem(
                            'No policies configured',
                            vscode.TreeItemCollapsibleState.None,
                            undefined,
                            new vscode.ThemeIcon('warning')
                        )
                    ];
                }
                return [
                    new SummaryTreeItem(
                        'Total Policies',
                        vscode.TreeItemCollapsibleState.None,
                        summary.policies.count.toString(),
                        new vscode.ThemeIcon('list-ordered')
                    )
                ];

            case 'externalAccess':
                return [
                    new SummaryTreeItem(
                        'Risk Level',
                        vscode.TreeItemCollapsibleState.None,
                        summary.externalAccess.risk.toUpperCase(),
                        this.getRiskIcon(summary.externalAccess.risk)
                    ),
                    new SummaryTreeItem(
                        'Description',
                        vscode.TreeItemCollapsibleState.None,
                        summary.externalAccess.description,
                        new vscode.ThemeIcon('note')
                    )
                ];

            default:
                return [];
        }
    }

    private getRiskIcon(risk: string): vscode.ThemeIcon {
        switch (risk.toLowerCase()) {
            case 'high':
                return new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
            case 'medium':
                return new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
            case 'low':
                return new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
            default:
                return new vscode.ThemeIcon('question');
        }
    }
}