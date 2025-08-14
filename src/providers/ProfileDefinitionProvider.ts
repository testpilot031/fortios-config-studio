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
        'schedule': /config firewall schedule/
    };

    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
        
        const line = document.lineAt(position.line);
        const text = line.text.trim();
        
        // Check if current line contains a profile reference
        const profileReference = this.extractProfileReference(text, position.character);
        if (!profileReference) {
            return null;
        }

        // Find the definition of this profile
        const definition = this.findProfileDefinition(document, profileReference.type, profileReference.name);
        if (!definition) {
            return null;
        }

        return new vscode.Location(document.uri, definition);
    }

    private extractProfileReference(lineText: string, characterPosition: number): { type: string, name: string } | null {
        // Match patterns like: set av-profile "profile_name"
        const setMatches = lineText.match(/set\s+([a-z-]+)\s+"([^"]+)"/);
        if (setMatches && this.PROFILE_PATTERNS[setMatches[1]]) {
            return {
                type: setMatches[1],
                name: setMatches[2]
            };
        }

        // Match patterns like: set av-profile profile_name (without quotes)
        const setMatchesNoQuotes = lineText.match(/set\s+([a-z-]+)\s+([^\s]+)/);
        if (setMatchesNoQuotes && this.PROFILE_PATTERNS[setMatchesNoQuotes[1]]) {
            return {
                type: setMatchesNoQuotes[1],
                name: setMatchesNoQuotes[2]
            };
        }

        // Check if cursor is positioned on a profile name
        const wordRange = this.getWordAtPosition(lineText, characterPosition);
        if (!wordRange) {
            return null;
        }

        const word = lineText.substring(wordRange.start, wordRange.end);
        
        // Look for profile type in the same line
        for (const [profileType, pattern] of Object.entries(this.PROFILE_PATTERNS)) {
            if (lineText.includes(profileType)) {
                return {
                    type: profileType,
                    name: word.replace(/"/g, '') // Remove quotes if present
                };
            }
        }

        return null;
    }

    private getWordAtPosition(text: string, position: number): { start: number, end: number } | null {
        const before = text.slice(0, position);
        const after = text.slice(position);
        
        const beforeMatch = before.match(/[\w-"]*$/);
        const afterMatch = after.match(/^[\w-"]*/);
        
        if (!beforeMatch || !afterMatch) {
            return null;
        }

        return {
            start: position - beforeMatch[0].length,
            end: position + afterMatch[0].length
        };
    }

    private findProfileDefinition(document: vscode.TextDocument, profileType: string, profileName: string): vscode.Range | null {
        const configPattern = this.PROFILE_PATTERNS[profileType];
        if (!configPattern) {
            return null;
        }

        let inConfigSection = false;
        let configStartLine = -1;

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const text = line.text.trim();

            // Check for config section start
            if (configPattern.test(text)) {
                inConfigSection = true;
                configStartLine = i;
                continue;
            }

            // Check for config section end
            if (inConfigSection && text === 'end') {
                inConfigSection = false;
                continue;
            }

            // Look for edit blocks within the config section
            if (inConfigSection) {
                // Match: edit "profile_name" or edit profile_name
                const editMatch = text.match(/^edit\s+"?([^"\s]+)"?/);
                if (editMatch) {
                    const editName = editMatch[1];
                    if (editName === profileName) {
                        return new vscode.Range(
                            i,
                            text.indexOf('edit'),
                            i,
                            text.length
                        );
                    }
                }
            }
        }

        return null;
    }
}