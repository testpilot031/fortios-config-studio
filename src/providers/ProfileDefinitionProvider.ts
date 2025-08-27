import * as vscode from 'vscode';

export class FortiOSProfileDefinitionProvider implements vscode.DefinitionProvider {

    private readonly PROFILE_PATTERNS: { [key: string]: RegExp } = {
        'av-profile': /config antivirus profile/,
        'ips-sensor': /config ips sensor/,
        'webfilter-profile': /config webfilter profile/,
        'application-list': /config application list/,
        'ssl-ssh-profile': /config firewall ssl-ssh-profile/,
        'voip-profile': /config voip profile/,
        'dnsfilter-profile': /config dnsfilter profile/,
        'emailfilter-profile': /config emailfilter profile/,
        'dlp-sensor': /config dlp sensor/,
        'icap-profile': /config icap profile/,
        'waf-profile': /config waf profile/,
        'profile-protocol-options': /config firewall profile-protocol-options/,
        'schedule': /config firewall schedule/,
        // Proxy policy specific profiles
        'http-profile': /config web-proxy profile/,
        'web-proxy-profile': /config web-proxy profile/,
        'explicit-web-proxy': /config web-proxy explicit/,
        'web-cache': /config web-proxy url-match/
    };

    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition> {

        // Extract profile reference from current position
        const profileRef = this.extractProfileReference(document, position);
        if (!profileRef) {
            return null;
        }

        // Find the definition of this profile
        const definition = this.findProfileDefinition(document, profileRef.type, profileRef.name);
        return definition;
    }

    private extractProfileReference(document: vscode.TextDocument, position: vscode.Position): { type: string, name: string } | null {
        const line = document.lineAt(position.line);
        const text = line.text;
        const character = position.character;

        // Match patterns like: set ssl-ssh-profile "certificate-inspection"
        const quotedPattern = /set\s+([a-z-]+)\s+"([^"]+)"/g;
        let quotedMatch;
        while ((quotedMatch = quotedPattern.exec(text)) !== null) {
            const profileType = quotedMatch[1];
            const profileName = quotedMatch[2];
            const startQuote = quotedMatch.index + quotedMatch[0].indexOf('"');
            const endQuote = startQuote + profileName.length + 1;
            
            // Check if cursor is within the quoted profile name
            if (this.PROFILE_PATTERNS[profileType] && character >= startQuote && character <= endQuote) {
                return {
                    type: profileType,
                    name: profileName
                };
            }
        }

        // Match patterns like: set ssl-ssh-profile certificate-inspection (without quotes)
        const unquotedPattern = /set\s+([a-z-]+)\s+([^\s]+)/g;
        let unquotedMatch;
        while ((unquotedMatch = unquotedPattern.exec(text)) !== null) {
            const profileType = unquotedMatch[1];
            const profileName = unquotedMatch[2];
            const nameStart = unquotedMatch.index + unquotedMatch[0].indexOf(profileName);
            const nameEnd = nameStart + profileName.length;
            
            // Check if cursor is within the profile name
            if (this.PROFILE_PATTERNS[profileType] && character >= nameStart && character <= nameEnd) {
                return {
                    type: profileType,
                    name: profileName
                };
            }
        }

        return null;
    }

    private findProfileDefinition(document: vscode.TextDocument, profileType: string, profileName: string): vscode.Location | null {
        const configPattern = this.PROFILE_PATTERNS[profileType];
        
        // Stack-based approach to handle nested structures correctly
        const stack: Array<{ type: 'config' | 'edit', line: number, text: string }> = [];
        let inTargetConfigSection = false;
        
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const text = line.text.trim();

            // Handle config statements - push to stack
            const configMatch = text.match(/^config\s+(.+)/);
            if (configMatch) {
                stack.push({ type: 'config', line: i, text: text });
                
                // Check if this is our target config section
                if (configPattern.test(text)) {
                    inTargetConfigSection = true;
                }
                continue;
            }

            // Handle edit statements - push to stack
            const editMatch = text.match(/^edit\s+"?([^"\s]+)"?/);
            if (editMatch) {
                stack.push({ type: 'edit', line: i, text: text });
                
                // Check if this is the profile we're looking for and we're in the right section
                if (inTargetConfigSection && editMatch[1] === profileName) {
                    const range = new vscode.Range(i, 0, i, text.length);
                    return new vscode.Location(document.uri, range);
                }
                continue;
            }

            // Handle end statements - pop from stack if it's a config
            if (text === 'end') {
                if (stack.length > 0) {
                    const lastElement = stack[stack.length - 1];
                    if (lastElement.type === 'config') {
                        // Check if we're leaving the target config section
                        if (inTargetConfigSection && configPattern.test(lastElement.text)) {
                            inTargetConfigSection = false;
                        }
                        stack.pop();
                    }
                }
                continue;
            }

            // Handle next statements - pop from stack if it's an edit
            if (text === 'next') {
                if (stack.length > 0) {
                    const lastElement = stack[stack.length - 1];
                    if (lastElement.type === 'edit') {
                        stack.pop();
                    }
                }
                continue;
            }
        }

        return null;
    }
}