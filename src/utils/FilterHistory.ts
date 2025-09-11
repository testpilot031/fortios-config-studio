import * as vscode from 'vscode';

export interface SavedFilter {
    name: string;
    pattern: string;
    description?: string;
    icon?: string;
    isBuiltIn?: boolean;
}

export class FilterHistory {
    private static readonly MAX_HISTORY = 15;
    private static readonly STORAGE_KEY = 'fortios.filterHistory';
    private static readonly SAVED_FILTERS_KEY = 'fortios.savedFilters';
    
    private context: vscode.ExtensionContext;
    private history: string[] = [];
    private savedFilters: SavedFilter[] = [];

    // Built-in preset filters
    private static readonly DEFAULT_FILTERS: SavedFilter[] = [
        { 
            name: "System Configuration", 
            pattern: "system", 
            description: "System settings and global config",
            icon: "$(gear)",
            isBuiltIn: true
        },
        { 
            name: "Network Interfaces", 
            pattern: "interface", 
            description: "Network interface configuration",
            icon: "$(plug)",
            isBuiltIn: true
        },
        { 
            name: "Security Policies", 
            pattern: "(policy|firewall)", 
            description: "Firewall policies and security rules",
            icon: "$(shield)",
            isBuiltIn: true
        },
        { 
            name: "Routing Configuration", 
            pattern: "(router|route)", 
            description: "Routing and gateway settings",
            icon: "$(arrow-swap)",
            isBuiltIn: true
        },
        { 
            name: "User & Authentication", 
            pattern: "(user|ldap|radius|saml)", 
            description: "User management and authentication",
            icon: "$(person)",
            isBuiltIn: true
        },
        { 
            name: "VPN Settings", 
            pattern: "(vpn|ipsec|ssl)", 
            description: "VPN and secure connection settings",
            icon: "$(lock)",
            isBuiltIn: true
        },
        { 
            name: "Logging Configuration", 
            pattern: "(log|syslog)", 
            description: "Logging and monitoring settings",
            icon: "$(list-ordered)",
            isBuiltIn: true
        },
        { 
            name: "Web Filter & Security", 
            pattern: "(webfilter|antivirus|ips)", 
            description: "Content filtering and threat protection",
            icon: "$(shield-check)",
            isBuiltIn: true
        }
    ];

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadHistory();
        this.loadSavedFilters();
    }

    // Add filter to history
    addToHistory(filterText: string): void {
        if (!filterText || filterText.trim() === '') return;
        
        const trimmedFilter = filterText.trim();
        
        // Remove if already exists
        this.history = this.history.filter(item => item !== trimmedFilter);
        
        // Add to beginning
        this.history.unshift(trimmedFilter);
        
        // Limit size
        if (this.history.length > FilterHistory.MAX_HISTORY) {
            this.history = this.history.slice(0, FilterHistory.MAX_HISTORY);
        }
        
        this.saveHistory();
    }

    // Get filter history
    getHistory(): string[] {
        return [...this.history];
    }

    // Get all saved filters (built-in + custom)
    getSavedFilters(): SavedFilter[] {
        return [...FilterHistory.DEFAULT_FILTERS, ...this.savedFilters];
    }

    // Get only custom saved filters
    getCustomSavedFilters(): SavedFilter[] {
        return [...this.savedFilters];
    }

    // Save custom filter
    saveFilter(filter: SavedFilter): void {
        // Check if filter with same name already exists
        const existingIndex = this.savedFilters.findIndex(f => f.name === filter.name);
        
        if (existingIndex >= 0) {
            this.savedFilters[existingIndex] = { ...filter, isBuiltIn: false };
        } else {
            this.savedFilters.push({ ...filter, isBuiltIn: false });
        }
        
        this.saveSavedFilters();
    }

    // Remove custom saved filter
    removeFilter(filterName: string): boolean {
        const initialLength = this.savedFilters.length;
        this.savedFilters = this.savedFilters.filter(f => f.name !== filterName);
        
        if (this.savedFilters.length < initialLength) {
            this.saveSavedFilters();
            return true;
        }
        return false;
    }

    // Clear history
    clearHistory(): void {
        this.history = [];
        this.saveHistory();
    }

    // Clear custom saved filters
    clearSavedFilters(): void {
        this.savedFilters = [];
        this.saveSavedFilters();
    }

    // Create QuickPick items for history
    getHistoryQuickPickItems(): vscode.QuickPickItem[] {
        return this.history.map(filter => ({
            label: `$(history) ${filter}`,
            detail: 'Recent search',
            description: filter
        }));
    }

    // Create QuickPick items for saved filters
    getSavedFiltersQuickPickItems(): vscode.QuickPickItem[] {
        return this.getSavedFilters().map(filter => ({
            label: `${filter.icon || '$(filter)'} ${filter.name}`,
            detail: filter.description || 'Saved filter',
            description: filter.pattern
        }));
    }

    // Create combined QuickPick items
    getAllQuickPickItems(): vscode.QuickPickItem[] {
        const items: vscode.QuickPickItem[] = [];
        
        // Add saved filters first
        const savedItems = this.getSavedFiltersQuickPickItems();
        if (savedItems.length > 0) {
            items.push(
                { label: '', kind: vscode.QuickPickItemKind.Separator },
                { label: 'Preset Filters', kind: vscode.QuickPickItemKind.Separator },
                ...savedItems
            );
        }
        
        // Add history
        const historyItems = this.getHistoryQuickPickItems();
        if (historyItems.length > 0) {
            items.push(
                { label: '', kind: vscode.QuickPickItemKind.Separator },
                { label: 'Recent Searches', kind: vscode.QuickPickItemKind.Separator },
                ...historyItems
            );
        }
        
        // Add utility options
        items.push(
            { label: '', kind: vscode.QuickPickItemKind.Separator },
            { label: 'Actions', kind: vscode.QuickPickItemKind.Separator },
            {
                label: '$(search) Custom Search...',
                detail: 'Enter new search text',
                description: 'custom'
            },
            {
                label: '$(clear-all) Clear Filter',
                detail: 'Remove current filter',
                description: 'clear'
            }
        );
        
        return items;
    }

    // Load history from storage
    private loadHistory(): void {
        const stored = this.context.globalState.get<string[]>(FilterHistory.STORAGE_KEY);
        if (stored && Array.isArray(stored)) {
            this.history = stored;
        }
    }

    // Save history to storage
    private saveHistory(): void {
        this.context.globalState.update(FilterHistory.STORAGE_KEY, this.history);
    }

    // Load saved filters from storage
    private loadSavedFilters(): void {
        const stored = this.context.globalState.get<SavedFilter[]>(FilterHistory.SAVED_FILTERS_KEY);
        if (stored && Array.isArray(stored)) {
            this.savedFilters = stored.map(f => ({ ...f, isBuiltIn: false }));
        }
    }

    // Save custom filters to storage
    private saveSavedFilters(): void {
        this.context.globalState.update(FilterHistory.SAVED_FILTERS_KEY, this.savedFilters);
    }
}