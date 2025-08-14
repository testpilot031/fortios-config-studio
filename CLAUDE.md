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
│   ├── DocumentSymbolProvider.ts  # Outline tree structure
│   └── CompletionItemProvider.ts  # Context-aware autocompletion
├── parsers/
│   ├── FortiOSParser.ts           # Dynamic config parsing with nested support
│   └── ConfigAnalyzer.ts          # Summary extraction and analysis
├── commands/
│   ├── CommentToggle.ts           # Comment toggle functionality
│   └── ShowSummary.ts             # Configuration summary display
└── data/
    └── commands.ts                # FortiOS command definitions for completion
```

## Requirements Reference

The complete feature requirements are documented in `fortios-vscode-extension-requirements.md`. This includes planned features beyond the current MVP implementation such as outline views, configuration summary extraction, and completion providers.