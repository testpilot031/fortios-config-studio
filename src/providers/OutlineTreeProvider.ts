import * as vscode from 'vscode';
import { FortiOSParser, ConfigBlock } from '../parsers/FortiOSParser';
import { FilterHistory, SavedFilter } from '../utils/FilterHistory';

// Extended interface for tree display
interface ExtendedConfigBlock {
    type: 'config' | 'edit' | 'section' | 'info';
    name: string;
    fullPath: string;
    startLine: number;
    endLine: number;
    children: ConfigBlock[];
    parent?: ConfigBlock;
}

export class OutlineTreeItem extends vscode.TreeItem {
    constructor(
        public readonly block: ExtendedConfigBlock,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly parent?: OutlineTreeItem
    ) {
        super(block.name, collapsibleState);
        
        this.contextValue = 'configBlock';
        this.tooltip = `${block.name} (Line ${block.startLine + 1})`;
        
        // Set icon based on block type and section
        this.iconPath = this.getBlockIcon(block);
        
        // Command to jump to line when clicked
        if (block.startLine >= 0) {
            this.command = {
                command: 'fortios.jumpToLine',
                title: 'Jump to Configuration',
                arguments: [block.startLine]
            };
        }
        
        // Add description for filtering
        this.description = this.getBlockDescription(block);
    }
    
    private getBlockIcon(block: ExtendedConfigBlock): vscode.ThemeIcon {
        if (block.type === 'config') {
            const section = block.name.split(' ')[0];
            switch (section) {
                case 'system':
                    return new vscode.ThemeIcon('settings-gear');
                case 'firewall':
                case 'policy':
                    return new vscode.ThemeIcon('shield');
                case 'interface':
                    return new vscode.ThemeIcon('plug');
                case 'router':
                case 'route':
                    return new vscode.ThemeIcon('route');
                case 'user':
                    return new vscode.ThemeIcon('person');
                case 'vpn':
                    return new vscode.ThemeIcon('lock');
                case 'log':
                    return new vscode.ThemeIcon('list-ordered');
                case 'webfilter':
                    return new vscode.ThemeIcon('globe');
                case 'antivirus':
                    return new vscode.ThemeIcon('bug');
                default:
                    return new vscode.ThemeIcon('folder');
            }
        } else {
            return new vscode.ThemeIcon('symbol-property');
        }
    }
    
    private getBlockDescription(block: ExtendedConfigBlock): string {
        if (block.type === 'edit') {
            return block.name; // Use name instead of non-existent identifier
        }
        return '';
    }
}

export class FortiOSOutlineTreeProvider implements vscode.TreeDataProvider<OutlineTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<OutlineTreeItem | undefined | null | void> = new vscode.EventEmitter<OutlineTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<OutlineTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private parser: FortiOSParser;
    private currentDocument: vscode.TextDocument | undefined;
    private rootItems: OutlineTreeItem[] = [];
    private filterText: string = '';
    private filterHistory: FilterHistory;

    constructor(context: vscode.ExtensionContext) {
        this.parser = new FortiOSParser();
        this.filterHistory = new FilterHistory(context);
        
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

    // Public method to apply filter
    applyFilter(filterText: string): void {
        this.filterText = filterText.toLowerCase();
        
        // Add to history if not empty
        if (filterText.trim()) {
            this.filterHistory.addToHistory(filterText.trim());
        }
        
        this.refresh();
    }

    // Get current filter text
    get currentFilter(): string {
        return this.filterText;
    }

    // Get filter history
    getFilterHistory(): FilterHistory {
        return this.filterHistory;
    }

    // Apply saved filter
    applySavedFilter(savedFilter: SavedFilter): void {
        this.applyFilter(savedFilter.pattern);
    }

    getTreeItem(element: OutlineTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: OutlineTreeItem): Thenable<OutlineTreeItem[]> {
        if (!element) {
            const rootItems = this.getRootItems();
            return Promise.resolve(this.applyFilterToItems(rootItems));
        }
        
        const childItems = this.getChildItems(element);
        return Promise.resolve(this.applyFilterToItems(childItems));
    }

    private getRootItems(): OutlineTreeItem[] {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor || editor.document.languageId !== 'fortios') {
            return [
                new OutlineTreeItem(
                    {
                        name: 'No FortiOS configuration file open',
                        type: 'info',
                        startLine: -1,
                        endLine: -1,
                        children: [],
                        fullPath: ''
                    } as ExtendedConfigBlock,
                    vscode.TreeItemCollapsibleState.None
                )
            ];
        }

        this.currentDocument = editor.document;
        const blocks = this.parser.parseDocument(editor.document);
        
        // Convert blocks to tree structure
        this.rootItems = this.convertToTreeItems(blocks);
        return this.rootItems;
    }

    private getChildItems(element: OutlineTreeItem): OutlineTreeItem[] {
        return element.block.children.map(child => this.createTreeItem(child, element));
    }

    private convertToTreeItems(blocks: ConfigBlock[], parent?: OutlineTreeItem): OutlineTreeItem[] {
        const sections = this.parser.getConfigSections(blocks);
        const items: OutlineTreeItem[] = [];

        // Group blocks by section
        for (const section of sections) {
            const sectionBlocks = this.parser.getBlocksBySection(blocks, section);
            if (sectionBlocks.length === 0) continue;

            // Create section header
            const sectionItem = new OutlineTreeItem(
                {
                    name: this.getSectionDisplayName(section),
                    type: 'section',
                    startLine: sectionBlocks[0].startLine,
                    endLine: Math.max(...sectionBlocks.map(b => b.endLine >= 0 ? b.endLine : b.startLine)),
                    children: [],
                    fullPath: section
                } as ExtendedConfigBlock,
                vscode.TreeItemCollapsibleState.Expanded,
                parent
            );

            // Add individual config blocks as children
            for (const block of sectionBlocks) {
                const blockItem = this.createTreeItem(block, sectionItem);
                sectionItem.block.children.push(block);
            }

            items.push(sectionItem);
        }

        return items;
    }

    private createTreeItem(block: ConfigBlock, parent?: OutlineTreeItem): OutlineTreeItem {
        const hasChildren = block.children && block.children.length > 0;
        const collapsibleState = hasChildren 
            ? vscode.TreeItemCollapsibleState.Collapsed 
            : vscode.TreeItemCollapsibleState.None;

        return new OutlineTreeItem(block as ExtendedConfigBlock, collapsibleState, parent);
    }

    private getSectionDisplayName(section: string): string {
        const sectionNames: { [key: string]: string } = {
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

    // Apply filter to items array
    private applyFilterToItems(items: OutlineTreeItem[]): OutlineTreeItem[] {
        if (!this.filterText) {
            return items;
        }

        return items.filter(item => this.itemMatchesFilter(item));
    }

    // Check if item matches the current filter
    private itemMatchesFilter(item: OutlineTreeItem): boolean {
        if (!this.filterText) {
            return true;
        }

        // Detect if filter contains regex patterns (|, ^, $, [], etc.)
        const isRegexPattern = this.containsRegexPatterns(this.filterText);

        if (isRegexPattern) {
            return this.matchesRegex(item, this.filterText);
        } else {
            return this.matchesText(item, this.filterText);
        }
    }

    // Check if filter text contains regex patterns
    private containsRegexPatterns(filterText: string): boolean {
        const regexPatterns = ['|', '^', '$', '[', ']', '(', ')', '*', '+', '?', '{', '}'];
        return regexPatterns.some(pattern => filterText.includes(pattern));
    }

    // Text-based matching (original behavior)
    private matchesText(item: OutlineTreeItem, filterText: string): boolean {
        // Check if element name matches
        if (item.block.name.toLowerCase().includes(filterText)) {
            return true;
        }

        // Check if description matches
        if (item.description && typeof item.description === 'string') {
            if (item.description.toLowerCase().includes(filterText)) {
                return true;
            }
        }

        // Check if fullPath matches
        if (item.block.fullPath.toLowerCase().includes(filterText)) {
            return true;
        }

        // Check if any child matches (for parent visibility)
        return this.hasMatchingChildrenText(item, filterText);
    }

    // Regex-based matching
    private matchesRegex(item: OutlineTreeItem, pattern: string): boolean {
        try {
            const regex = new RegExp(pattern, 'i'); // Case-insensitive

            // Check if element name matches
            if (regex.test(item.block.name)) {
                return true;
            }

            // Check if description matches
            if (item.description && typeof item.description === 'string') {
                if (regex.test(item.description)) {
                    return true;
                }
            }

            // Check if fullPath matches
            if (regex.test(item.block.fullPath)) {
                return true;
            }

            // Check if any child matches (for parent visibility)
            return this.hasMatchingChildrenRegex(item, regex);

        } catch (error) {
            // Invalid regex pattern, fall back to text matching
            console.warn(`Invalid regex pattern: ${pattern}, falling back to text search`);
            return this.matchesText(item, pattern);
        }
    }

    // Check if any child elements match the filter (text-based)
    private hasMatchingChildrenText(item: OutlineTreeItem, filterText: string): boolean {
        return item.block.children.some(child => {
            const childName = child.name.toLowerCase();
            const childPath = child.fullPath.toLowerCase();
            
            if (childName.includes(filterText) || childPath.includes(filterText)) {
                return true;
            }

            // Recursively check grandchildren
            return child.children && child.children.length > 0 && 
                   child.children.some(grandChild => {
                       const grandChildName = grandChild.name.toLowerCase();
                       const grandChildPath = grandChild.fullPath.toLowerCase();
                       return grandChildName.includes(filterText) || grandChildPath.includes(filterText);
                   });
        });
    }

    // Check if any child elements match the filter (regex-based)
    private hasMatchingChildrenRegex(item: OutlineTreeItem, regex: RegExp): boolean {
        return item.block.children.some(child => {
            const childName = child.name;
            const childPath = child.fullPath;
            
            if (regex.test(childName) || regex.test(childPath)) {
                return true;
            }

            // Recursively check grandchildren
            return child.children && child.children.length > 0 && 
                   child.children.some(grandChild => {
                       return regex.test(grandChild.name) || regex.test(grandChild.fullPath);
                   });
        });
    }
}