"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FortiOSSummaryTreeProvider = exports.SummaryTreeItem = void 0;
const vscode = require("vscode");
const ConfigAnalyzer_1 = require("../parsers/ConfigAnalyzer");
class SummaryTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, value, iconPath, contextValue) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.value = value;
        this.iconPath = iconPath;
        this.contextValue = contextValue;
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
exports.SummaryTreeItem = SummaryTreeItem;
class FortiOSSummaryTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.analyzer = new ConfigAnalyzer_1.ConfigAnalyzer();
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
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return Promise.resolve(this.getRootItems());
        }
        return Promise.resolve(this.getChildItems(element));
    }
    getRootItems() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'fortios') {
            return [
                new SummaryTreeItem('No FortiOS configuration file open', vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon('info'))
            ];
        }
        this.currentDocument = editor.document;
        const summary = this.analyzer.analyzeDocument(editor.document);
        return [
            new SummaryTreeItem('Basic Information', vscode.TreeItemCollapsibleState.Expanded, undefined, new vscode.ThemeIcon('info'), 'basicInfo'),
            new SummaryTreeItem('Network Interfaces', vscode.TreeItemCollapsibleState.Expanded, `${summary.interfaces.count} interfaces`, new vscode.ThemeIcon('plug'), 'interfaces'),
            new SummaryTreeItem('Security Policies', vscode.TreeItemCollapsibleState.Expanded, `${summary.policies.count} policies`, new vscode.ThemeIcon('shield'), 'policies'),
            new SummaryTreeItem('External Access', vscode.TreeItemCollapsibleState.Expanded, summary.externalAccess.risk.toUpperCase(), this.getRiskIcon(summary.externalAccess.risk), 'externalAccess')
        ];
    }
    getChildItems(element) {
        if (!this.currentDocument) {
            return [];
        }
        const summary = this.analyzer.analyzeDocument(this.currentDocument);
        switch (element.contextValue) {
            case 'basicInfo':
                return [
                    new SummaryTreeItem('Device Model', vscode.TreeItemCollapsibleState.None, summary.deviceModel, new vscode.ThemeIcon('circuit-board')),
                    new SummaryTreeItem('Version', vscode.TreeItemCollapsibleState.None, summary.version, new vscode.ThemeIcon('versions')),
                    new SummaryTreeItem('Build Number', vscode.TreeItemCollapsibleState.None, summary.buildno, new vscode.ThemeIcon('tools')),
                    new SummaryTreeItem('Hostname', vscode.TreeItemCollapsibleState.None, summary.hostname, new vscode.ThemeIcon('device-desktop')),
                    new SummaryTreeItem('Serial Number', vscode.TreeItemCollapsibleState.None, summary.serialNumber, new vscode.ThemeIcon('key'))
                ];
            case 'interfaces':
                return summary.interfaces.configured.map((iface) => new SummaryTreeItem(iface, vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon('symbol-interface')));
            case 'policies':
                if (summary.policies.count === 0) {
                    return [
                        new SummaryTreeItem('No policies configured', vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon('warning'))
                    ];
                }
                return [
                    new SummaryTreeItem('Total Policies', vscode.TreeItemCollapsibleState.None, summary.policies.count.toString(), new vscode.ThemeIcon('list-ordered'))
                ];
            case 'externalAccess':
                return [
                    new SummaryTreeItem('Risk Level', vscode.TreeItemCollapsibleState.None, summary.externalAccess.risk.toUpperCase(), this.getRiskIcon(summary.externalAccess.risk)),
                    new SummaryTreeItem('Description', vscode.TreeItemCollapsibleState.None, summary.externalAccess.description, new vscode.ThemeIcon('note'))
                ];
            default:
                return [];
        }
    }
    getRiskIcon(risk) {
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
exports.FortiOSSummaryTreeProvider = FortiOSSummaryTreeProvider;
//# sourceMappingURL=SummaryTreeProvider.js.map