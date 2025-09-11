# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VS Code extension that provides enhanced syntax support and productivity features for FortiOS configuration files (.conf, .cfg). The extension implements language server features including syntax highlighting, code folding, bracket matching, and comment toggling.

## Development Commands

- `npm run compile` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode compilation during development
- `npm run lint` - Run ESLint on TypeScript source files
- `npm run test` - Run extension tests (requires compilation and lint to pass)
- `npm run vscode:prepublish` - Prepare extension for publishing (runs compile)

## Architecture

### Core Extension Structure

**Extension Entry Point** (`src/extension.ts`):
- Main activation function registers all language providers
- Handles VS Code extension lifecycle (activate/deactivate)
- Registers providers for the 'fortios' language identifier

**Language Providers** (`src/providers/`):
- `FoldingRangeProvider.ts` - Implements folding for `config`/`end` and `edit`/`next` blocks with nested support
- `BracketMatchingProvider.ts` - Provides document highlighting for matching FortiOS block keywords
- Uses stack-based parsing to handle nested configuration blocks properly

**Commands** (`src/commands/`):
- `CommentToggle.ts` - Handles both FortiOS (`#`) and Cisco ASA (`!`) comment styles
- Supports single-line and multi-line comment toggling

### Language Configuration

**Language Definition**:
- `language-configuration.json` - Defines bracket pairs, indentation rules, and folding markers
- `syntaxes/fortios.tmLanguage.json` - TextMate grammar for syntax highlighting
- Supports FortiOS-specific patterns: IP addresses, configuration blocks, commands

**File Extensions**: `.conf` and `.cfg` files are recognized as FortiOS configuration files

### Key Implementation Details

**Block Structure Recognition**:
- `config <section>` paired with `end`
- `edit <identifier>` paired with `next`
- Stack-based parsing ensures proper nesting and matching

**Comment Handling**:
- Primary: `#` (FortiOS style)
- Secondary: `!` (Cisco ASA compatibility)
- Comment toggle preserves indentation and handles whitespace correctly

**Syntax Features**:
- IP address pattern matching with CIDR notation
- FortiOS command recognition (set, unset, edit, config, etc.)
- String literal handling with escape sequences

## Debugging and Testing

### Debug Setup
- `.vscode/launch.json` - Extension host debug configuration
- `.vscode/tasks.json` - TypeScript compilation tasks
- `test-files/sample.conf` - Test FortiOS configuration file

### Debug Process
1. **Open Project**: `code /Users/koudai/project/fortios-config-studio`
2. **Compile**: `npm run compile` (required before debugging)
3. **Start Debug**: Press `F5` or select "Run Extension" from Run and Debug panel
4. **Test**: Extension Development Host window opens - test with `test-files/sample.conf`
5. **Monitor**: Check console logs with `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)

### Features to Test
- **Config Block Folding**: Click arrows next to `config`/`edit` lines
- **Bracket Matching**: Click on `config`, `end`, `edit`, `next` keywords for highlighting
- **Comment Toggle**: `Ctrl+/` (Windows/Linux) or `Cmd+/` (Mac) for `#` comments
- **Syntax Highlighting**: FortiOS keywords, IP addresses, strings in `.conf`/`.cfg` files

### Development Workflow
- Use `npm run watch` for continuous compilation during development
- Check `npm run lint` before committing changes
- Test with nested `config` blocks and `edit` sections in sample files

## Implementation Progress

### ✅ Tier 1: 基本機能（MVP）- COMPLETED

#### 1. 強化されたシンタックス機能 - COMPLETED
- ✅ **Config Block Folding**: `FoldingRangeProvider.ts` - Supports nested `config`/`end` and `edit`/`next` blocks
- ✅ **Indent Guidelines**: `language-configuration.json` - Auto-indentation and bracket matching
- ✅ **Bracket/Block Matching**: `BracketMatchingProvider.ts` - Highlights matching FortiOS keywords
- ✅ **Comment Toggle**: `CommentToggle.ts` - Supports both `#` (FortiOS) and `!` (Cisco ASA) styles

#### 2. 構造化機能 - COMPLETED
- ✅ **Dynamic Parser**: `FortiOSParser.ts` - Extracts config sections dynamically from file content
- ✅ **Structured Outline**: `DocumentSymbolProvider.ts` - Hierarchical tree view with proper nesting
  - Displays sections like 🔧 System, 🛡️ Security, 🛣️ Network automatically
  - Correctly handles nested structures (config > edit > config)
  - Recursive child element processing for complex hierarchies
- ✅ **Configuration Summary**: `ConfigAnalyzer.ts` + `ShowSummary.ts`
  - Extracts FortiOS version, hostname, serial number, interface count, policy count
  - WebView panel with color-coded risk assessment
  - Command palette integration: `FortiOS: Show Configuration Summary`
- ✅ **Context-Aware Completion**: `CompletionItemProvider.ts`
  - Dynamic completion based on current config context
  - Suggests appropriate `set` commands for current section
  - Triggers on space, newline, and tab

### ✅ Enhanced UI & Filtering - COMPLETED (v0.1.3)

#### 3. TreeView UI Migration - COMPLETED
- ✅ **Dedicated Sidebar**: FortiOS Explorer with 🛡️ shield icon in Activity Bar
- ✅ **Configuration Outline**: `OutlineTreeProvider.ts` - Hierarchical tree view with click-to-jump
- ✅ **Configuration Summary**: Integrated TreeView alongside outline
- ✅ **Jump Navigation**: Click outline items to navigate to configuration sections

#### 4. Advanced Filtering System - COMPLETED
- ✅ **Smart Filter Detection**: `OutlineTreeProvider.ts` - Auto-detects text vs regex patterns
- ✅ **Regex Support**: Full regular expression filtering with `(policy|firewall)` patterns
- ✅ **Filter History**: `FilterHistory.ts` - Persistent storage of recent searches (15 items)
- ✅ **Preset Filters**: 8 built-in FortiOS-specific filter presets:
  - 🔧 System Configuration (`system`)
  - 🔌 Network Interfaces (`interface`) 
  - 🛡️ Security Policies (`(policy|firewall)`)
  - 🛣️ Routing Configuration (`(router|route)`)
  - 👥 User & Authentication (`(user|ldap|radius|saml)`)
  - 🔒 VPN Settings (`(vpn|ipsec|ssl)`)
  - 📋 Logging Configuration (`(log|syslog)`)
  - 🛡️ Web Filter & Security (`(webfilter|antivirus|ips)`)
- ✅ **QuickPick UI**: Interactive filter selection with presets and history
- ✅ **Multiple Filter Commands**:
  - `fortios.filterOutline` - Text input with history suggestions
  - `fortios.quickFilter` - QuickPick with presets and history
  - `fortios.clearOutlineFilter` - Clear all active filters

### Key Architecture Decisions

**Dynamic Analysis Approach**: 
- No pre-defined config sections - all parsing is done dynamically from file content
- `FortiOSParser` builds hierarchical structure with proper parent-child relationships
- Fixed nested structure parsing by distinguishing `end` (closes config) vs `next` (closes edit)

**Outline Structure Generation**:
```typescript
// Recursive child processing in DocumentSymbolProvider
for (const child of block.children) {
    symbol.children.push(this.createBlockSymbol(document, child));
}
```

### Files Structure
```
src/
├── extension.ts                 # Main entry point - registers all providers
├── providers/
│   ├── FoldingRangeProvider.ts     # Code folding functionality
│   ├── BracketMatchingProvider.ts  # Keyword highlighting
│   ├── DocumentSymbolProvider.ts  # Outline tree structure (standard VS Code)
│   ├── OutlineTreeProvider.ts     # FortiOS TreeView with advanced filtering
│   ├── SummaryTreeProvider.ts     # Configuration summary TreeView
│   └── CompletionItemProvider.ts  # Context-aware autocompletion
├── parsers/
│   ├── FortiOSParser.ts           # Dynamic config parsing with nested support
│   └── ConfigAnalyzer.ts          # Summary extraction and analysis
├── commands/
│   ├── CommentToggle.ts           # Comment toggle functionality
│   └── ShowSummary.ts             # Configuration summary display
├── utils/
│   └── FilterHistory.ts           # Filter history and preset management
└── data/
    └── commands.ts                # FortiOS command definitions for completion
```

## Keyword Maintenance

### 🆕 RSS-Based Auto-Monitoring (Recommended)
The extension now features **automatic FortiOS version detection** via RSS feed monitoring. See `KEYWORDS_UPDATE_GUIDE.md` for complete documentation.

**RSS Monitor Commands:**
- `npm run rss-monitor` - Check RSS feed for new FortiOS versions and auto-update keywords
- `npm run update-keywords-from-version 7.6.4 7.4.8` - Update from specific versions
- GitHub Actions runs **daily at 02:00 UTC** and creates PRs when new versions detected

**Traditional Update Commands:**
- `npm run update-keywords` - Update from predefined FortiOS documentation URLs  
- `npm run update-keywords-manual` - Interactive manual update

**RSS Source:** `https://support.fortinet.com/rss/firmware.xml`  
**Current Keywords:** 42 keywords dynamically maintained from latest FortiOS versions in `syntaxes/fortios.tmLanguage.json:80`

**Automation Benefits:**
- ✅ Zero-maintenance keyword updates
- ✅ New FortiOS versions detected within 24 hours  
- ✅ Auto-generated PRs with detailed change logs
- ✅ Fallback systems ensure reliability

## Requirements Reference

The complete feature requirements are documented in `fortios-vscode-extension-requirements.md`. This includes planned features beyond the current MVP implementation such as outline views, configuration summary extraction, and completion providers.