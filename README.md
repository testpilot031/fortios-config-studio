# FortiOS Configuration Helper

![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-blue)
![Version](https://img.shields.io/badge/version-0.1.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

Enhanced syntax support and productivity features for FortiOS configuration files in Visual Studio Code.

## ✨ Features

### 🎨 Enhanced Syntax Highlighting
- **FortiOS-specific keywords** - Automatically updated from latest FortiOS versions
- **IP Address highlighting** - Distinguishes private vs public IPs with different colors
- **Configuration blocks** - Clear visual distinction for config sections
- **String literals** with proper escape sequence handling

### 📁 Code Structure & Navigation
- **Code Folding** - Collapse/expand `config`/`end` and `edit`/`next` blocks
- **Bracket Matching** - Highlights matching FortiOS keywords when clicked
- **Document Outline** - Hierarchical tree view of configuration sections in Explorer
- **Go to Definition** - Jump to profile definitions from references
- **Find All References** - Locate all usages of security profiles

### ⚡ Productivity Features  
- **Smart Code Completion** - Context-aware suggestions for FortiOS commands
- **Comment Toggle** - Support for both `#` (FortiOS) and `!` (Cisco ASA) styles
- **Configuration Summary** - Overview panel with device info, policy counts, and risk analysis
- **Auto-indent** - Proper indentation for nested configuration blocks

### 🔄 Automated Maintenance
- **RSS-based Updates** - Automatically monitors FortiOS releases and updates keywords
- **GitHub Actions Integration** - Daily checks for new FortiOS versions
- **Zero-maintenance** - Keywords stay current without manual intervention

## 🚀 Getting Started

### Installation
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "FortiOS Configuration Helper"
4. Click Install

### Usage
1. Open any `.conf` or `.cfg` file
2. The extension automatically activates for FortiOS configuration files
3. Enjoy enhanced syntax highlighting and productivity features!

## 📋 Supported File Types
- `.conf` - FortiOS configuration files
- `.cfg` - FortiOS configuration files

## 🔧 Available Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `FortiOS: Toggle Comment` | `Ctrl/Cmd + /` | Toggle line/block comments |
| `FortiOS: Show Configuration Summary` | Command Palette | Display configuration overview |
| `FortiOS: Refresh Summary` | - | Update summary panel |

## 📖 Features in Detail

### Code Folding
Collapse complex configuration sections for better readability:
```fortios
config system global ⏵
    # Collapsed content
end

config firewall policy ⏵
    # Collapsed content  
end
```

### Document Outline
Navigate large configurations easily with the hierarchical outline in Explorer:
- 🔧 System Configuration
  - Global Settings
  - Interface Configuration
- 🛡️ Security Policies
  - Firewall Policies
  - Security Profiles

### Smart Completion
Context-aware suggestions based on your current configuration section:
- Type `set ` in a firewall policy → suggests policy-specific options
- Type `set ` in system global → suggests global system options

### Profile Navigation
- **Go to Definition**: `F12` on profile references jumps to definition
- **Find References**: `Shift+F12` shows all profile usages

## 🔄 Automatic Updates

This extension features **RSS-based automatic keyword monitoring**:
- Monitors FortiOS firmware RSS feed daily
- Auto-updates syntax highlighting for new FortiOS versions  
- Creates pull requests when new keywords are detected
- Ensures compatibility with latest FortiOS releases

## 🎯 Use Cases

Perfect for:
- **Network Engineers** managing FortiGate firewalls
- **Security Administrators** reviewing FortiOS configurations
- **DevOps Teams** maintaining infrastructure-as-code for FortiOS
- **Consultants** analyzing client FortiGate configurations
- **Students** learning FortiOS configuration syntax

## 🛠️ Development

### Building from Source
```bash
git clone https://github.com/testpilot031/fortios-config-studio.git
cd fortios-config-studio
npm install
npm run compile
```

### Available Scripts
- `npm run compile` - Compile TypeScript
- `npm run watch` - Watch mode compilation  
- `npm run lint` - Run ESLint
- `npm run test` - Run extension tests
- `npm run rss-monitor` - Check for FortiOS updates

## 📝 Contributing

Contributions are welcome! Please feel free to submit:
- Bug reports via [Issues](https://github.com/testpilot031/fortios-config-studio/issues)
- Feature requests
- Pull requests

### Adding New Keywords
Keywords are automatically maintained via RSS monitoring, but manual updates are supported:
```bash
npm run update-keywords-manual
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/testpilot031/fortios-config-studio)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=fortios-config-studio.fortios-configuration-helper)
- [Issue Tracker](https://github.com/testpilot031/fortios-config-studio/issues)

## 📸 Screenshots

### Syntax Highlighting
![Syntax Highlighting](https://raw.githubusercontent.com/testpilot031/fortios-config-studio/main/images/syntax-highlighting.png)

### Document Outline  
![Document Outline](https://raw.githubusercontent.com/testpilot031/fortios-config-studio/main/images/document-outline.png)

### Configuration Summary
![Configuration Summary](https://raw.githubusercontent.com/testpilot031/fortios-config-studio/main/images/config-summary.png)

---

**Happy FortiOS Configuration Editing! 🚀**