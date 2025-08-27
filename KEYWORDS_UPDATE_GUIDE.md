# FortiOS Keywords Update Guide

This guide explains how to maintain and update FortiOS CLI configuration keywords in the VS Code extension.

## Overview

The extension's syntax highlighting depends on up-to-date FortiOS CLI configuration keywords stored in `syntaxes/fortios.tmLanguage.json`. These keywords need to be updated when new FortiOS versions are released with new configuration commands.

## Current Keywords

The extension currently supports 42 FortiOS configuration keywords from versions 7.2.11, 7.4.8, and 7.6.4:

```
alertemail, antivirus, application, authentication, automation, aws, azure, casb, 
certificate, diameter-filter, dlp, dnsfilter, dpdk, emailfilter, endpoint-control, 
ethernet-oam, extension-controller, file-filter, firewall, ftp-proxy, icap, ips, 
log, monitoring, nsxt, report, router, rule, sctp-filter, ssh-filter, 
switch-controller, system, user, videofilter, virtual-patch, voip, vpn, waf, 
wanopt, web-proxy, webfilter, wireless-controller
```

## Update Methods

### 1. RSS-Based Auto-Monitoring (Latest & Recommended)

#### 🆕 Real-time FortiOS Version Detection
The extension now monitors Fortinet's RSS feed for new FortiOS releases and automatically updates keywords when new versions are detected.

**RSS Feed Source:** `https://support.fortinet.com/rss/firmware.xml`

#### How it works:
1. **Daily Monitoring**: GitHub Actions runs daily at 02:00 UTC
2. **Version Detection**: Parses RSS feed for new FortiOS versions
3. **Smart Updates**: Only updates when new versions are found
4. **Auto-PR Creation**: Creates pull requests with detailed change information
5. **Error Handling**: Creates issues when updates fail

#### Manual RSS monitoring:
```bash
npm run rss-monitor
```

This will:
- Check RSS feed for new FortiOS versions
- Compare against cached version history
- Auto-update keywords if new versions found
- Cache results to avoid duplicate processing

#### Update from specific versions:
```bash
npm run update-keywords-from-version 7.6.4 7.4.8 7.2.11
```

**Benefits:**
- ✅ **Zero maintenance** - Automatically detects new releases
- ✅ **Smart caching** - Avoids redundant processing
- ✅ **Multiple fallbacks** - Tries different URL patterns
- ✅ **Comprehensive logging** - Detailed update information
- ✅ **GitHub integration** - Auto-creates PRs and issues

### 2. Traditional Automatic Updates

#### Using npm script:
```bash
npm run update-keywords
```

This script:
- Fetches keywords from multiple FortiOS documentation URLs
- Automatically updates `syntaxes/fortios.tmLanguage.json`
- Handles version differences and deduplication

#### Source URLs:
- FortiOS 7.6.4: https://docs.fortinet.com/document/fortigate/7.6.4/cli-reference/84566/fortios-cli-reference
- FortiOS 7.4.8: https://docs.fortinet.com/document/fortigate/7.4.8/cli-reference/84566
- FortiOS 7.2.11: https://docs.fortinet.com/document/fortigate/7.2.11/cli-reference/708841/cli-configuration-commands

### 2. Manual Updates (Safe Option)

#### Using interactive script:
```bash
npm run update-keywords-manual
```

This provides three options:
1. **Use current known keywords** - Uses the predefined keyword list
2. **Add custom keywords** - Adds new keywords to the existing list
3. **Replace with custom keywords** - Completely replaces the keyword list

### 4. GitHub Actions (Automated Maintenance)

#### RSS-Based Daily Monitoring (Primary):
- **Frequency**: Runs daily at 02:00 UTC
- **Source**: Monitors `https://support.fortinet.com/rss/firmware.xml`
- **Smart Detection**: Only processes when new FortiOS versions are found
- **Auto-PR Creation**: Creates detailed pull requests for successful updates
- **Error Handling**: Creates GitHub issues when updates fail
- **Caching**: Uses GitHub Actions cache to track version history

#### Traditional Monthly Fallback:
- **Frequency**: Runs on 1st of each month as backup
- **Source**: Uses predefined FortiOS documentation URLs
- **Purpose**: Ensures keywords stay current even if RSS monitoring fails

#### Workflow file: `.github/workflows/update-keywords.yml`

**Manual triggering:**
1. Go to repository's Actions tab
2. Select "Update FortiOS Keywords" workflow
3. Click "Run workflow"

**Monitoring workflow results:**
- ✅ **Successful updates**: Creates PR with `🆕 Auto-update FortiOS CLI Keywords from RSS Feed`
- ⚠️ **Failed updates**: Creates issue with `⚠️ FortiOS Version Update Failed`
- ℹ️ **No updates**: Workflow completes without action

## File Structure

```
fortios-config-studio/
├── scripts/
│   ├── rss-monitor.js                    # 🆕 RSS feed monitoring (primary)
│   ├── update-keywords-from-version.js   # 🆕 Version-based keyword fetching
│   ├── update-keywords.js                # Traditional keyword fetching  
│   └── manual-update.js                  # Interactive manual updates
├── .github/workflows/
│   └── update-keywords.yml               # Enhanced GitHub Actions with RSS monitoring
├── syntaxes/
│   └── fortios.tmLanguage.json          # Target file for keyword updates
└── .fortios-versions.json               # 🆕 RSS version cache (git-ignored)
```

## Implementation Details

### Keywords Location
Keywords are stored in the TextMate grammar file at:
```json
{
  "name": "support.type.fortios",
  "match": "\\b(keyword1|keyword2|...)\\b"
}
```

### RSS Monitoring Process
1. **RSS Fetch**: Parse Fortinet's firmware RSS feed
2. **Version Detection**: Extract FortiOS version numbers and metadata  
3. **Cache Comparison**: Compare against previous runs to find new versions
4. **URL Construction**: Dynamically build CLI reference URLs
5. **Multi-source Fallback**: Try multiple URL patterns for robustness
6. **Keyword Extraction**: Parse HTML content for config commands
7. **tmLanguage Update**: Update regex pattern with new keywords

### Traditional Update Process  
1. **Fetch**: Get keywords from predefined FortiOS documentation URLs
2. **Merge**: Combine keywords from multiple versions
3. **Deduplicate**: Remove duplicates and sort alphabetically
4. **Update**: Replace the regex pattern in tmLanguage.json

### Version Compatibility
The RSS monitoring system dynamically supports:
- **Latest versions**: Automatically detected from RSS feed
- **Multiple branches**: Tracks latest from different major.minor versions
- **Fallback support**: Always maintains compatibility with known stable versions

**Current baseline versions:**
- **FortiOS 7.6.4**: Latest stable release
- **FortiOS 7.4.8**: LTS version  
- **FortiOS 7.2.11**: Legacy support

**Dynamic URL patterns** for different version families:
- `7.4+`: `https://docs.fortinet.com/document/fortigate/{version}/cli-reference/84566/fortios-cli-reference`
- `7.2.x`: `https://docs.fortinet.com/document/fortigate/{version}/cli-reference/708841/cli-configuration-commands`
- Older: Multiple fallback patterns attempted

## Troubleshooting

### RSS Monitoring Issues
If RSS monitoring fails:
1. **Check RSS feed accessibility**: Visit `https://support.fortinet.com/rss/firmware.xml`
2. **Verify version cache**: Delete `.fortios-versions.json` and retry
3. **Check logs**: Review GitHub Actions workflow logs for details
4. **Manual trigger**: Run `npm run rss-monitor` locally for debugging

### Script Fails to Fetch
If keyword fetching fails:
1. Check internet connectivity
2. Verify FortiOS documentation URLs are accessible  
3. Try version-specific update: `npm run update-keywords-from-version 7.6.4`
4. Use manual update as fallback: `npm run update-keywords-manual`

### Syntax Highlighting Not Working
After updating keywords:
1. Restart VS Code
2. Reopen FortiOS configuration files
3. Check Developer Tools Console for errors

### GitHub Actions Not Running
If automation stops working:
1. Check Actions tab for failed workflows
2. Verify repository secrets and permissions  
3. Re-enable workflow if disabled due to inactivity
4. Check RSS feed accessibility from GitHub's servers
5. Verify cache permissions and workflow file syntax

## Adding New FortiOS Versions

### 🆕 RSS-Based System (Automatic)
New versions are **automatically detected** from the RSS feed! No manual intervention required.

When new FortiOS versions are released:
1. ✅ **RSS monitoring detects** new versions within 24 hours
2. ✅ **URL construction** automatically builds CLI reference URLs  
3. ✅ **GitHub Actions** creates PR with updated keywords
4. ✅ **Manual review** and merge the auto-generated PR

### Manual Addition (If needed)
If RSS detection fails or for specific version testing:

1. **Update directly from version**:
   ```bash
   npm run update-keywords-from-version 7.8.0 7.6.4 7.4.8
   ```

2. **Add to traditional script** (fallback only):
   ```javascript
   // In scripts/update-keywords.js
   const FORTIOS_DOCS_URLS = [
       'https://docs.fortinet.com/document/fortigate/7.8.0/cli-reference/84566/fortios-cli-reference',
       // ... existing URLs
   ];
   ```

3. **Test the update**:
   ```bash
   npm run compile && npm run lint
   ```

**URL Pattern Discovery**: The system tries multiple URL patterns automatically:
- Primary: `/cli-reference/84566/fortios-cli-reference`  
- Secondary: `/cli-reference/708841/cli-configuration-commands`
- Fallback: `/cli-reference` with various suffixes

## Best Practices

### For Developers
- ✅ **Trust the RSS system** - Let automation handle routine updates
- ✅ **Review auto-PRs promptly** - Merge RSS-generated PRs after verification  
- ✅ **Test locally when needed** - Use `npm run rss-monitor` for debugging
- ✅ **Monitor GitHub Actions** - Check for failed workflows and issues
- ⚠️ **Manual intervention** - Only needed when RSS system fails

### For CI/CD
- ✅ **Monitor automation** - Watch for auto-generated PRs and issues
- ✅ **Review RSS PRs carefully** - Verify new keywords make sense
- ✅ **Test after updates** - Ensure extension compiles and highlights correctly
- ✅ **Keep fallbacks working** - Maintain traditional update scripts as backup
- 📊 **Track RSS performance** - Monitor success rate of automatic detection

## Contributing

### RSS System Contributions:
1. **Report issues** - If RSS detection fails, create detailed issue reports
2. **Improve URL patterns** - Add new Fortinet documentation URL patterns  
3. **Enhance parsing** - Improve keyword extraction from HTML content
4. **Test thoroughly** - Verify RSS monitoring with various FortiOS versions

### Traditional Keyword Updates:
1. Follow the existing format and sorting
2. Test with sample FortiOS configuration files  
3. Update this documentation if adding new sources
4. Include the FortiOS version in commit messages

### System Monitoring:
- Monitor RSS feed changes and update parsing logic
- Track GitHub Actions performance and optimize workflows  
- Maintain fallback systems for reliability

## References

- [Fortinet RSS Feed](https://support.fortinet.com/rss/firmware.xml) - Primary source for version detection
- [FortiOS CLI Reference Documentation](https://docs.fortinet.com/) - Documentation source
- [TextMate Grammar Guide](https://macromates.com/manual/en/language_grammars) - Syntax highlighting reference
- [VS Code Language Extensions](https://code.visualstudio.com/api/language-extensions/overview) - Extension development guide
- [GitHub Actions Documentation](https://docs.github.com/en/actions) - Workflow automation reference

---

## Summary

The FortiOS Keywords Update system now features **🆕 RSS-based automatic monitoring** that:
- ✅ **Monitors daily** for new FortiOS versions
- ✅ **Updates automatically** when new versions are detected  
- ✅ **Creates PRs** with detailed change information
- ✅ **Handles errors** by creating GitHub issues
- ✅ **Maintains fallbacks** for reliability

**Result**: Zero-maintenance keyword updates that keep the VS Code extension current with the latest FortiOS releases!