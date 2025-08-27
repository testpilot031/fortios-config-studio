import * as vscode from 'vscode';

export class FortiOSProfileReferenceProvider implements vscode.ReferenceProvider {

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

    provideReferences(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.ReferenceContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Location[]> {

        // Extract profile name and type from current position
        const profileInfo = this.extractProfileInfo(document, position);
        if (!profileInfo) {
            return [];
        }

        const references: vscode.Location[] = [];

        // If includeDeclaration is true, include the definition itself
        if (context.includeDeclaration && profileInfo.isDefinition) {
            references.push(new vscode.Location(document.uri, new vscode.Range(position.line, 0, position.line, document.lineAt(position.line).text.length)));
        }

        // Find all references to this profile
        const profileReferences = this.findAllReferences(document, profileInfo.type, profileInfo.name);
        references.push(...profileReferences);

        return references;
    }

    private extractProfileInfo(document: vscode.TextDocument, position: vscode.Position): { type: string, name: string, isDefinition: boolean } | null {
        const line = document.lineAt(position.line);
        const text = line.text.trim();

        // Check if this is a profile definition (edit line)
        const editMatch = text.match(/^edit\s+"?([^"\s]+)"?/);
        if (editMatch) {
            const profileName = editMatch[1];
            const profileType = this.findProfileTypeFromContext(document, position.line);
            if (profileType) {
                return {
                    type: profileType,
                    name: profileName,
                    isDefinition: true
                };
            }
        }

        // Check if this is a profile reference (set line)
        const profileReference = this.extractProfileReference(text, position.character);
        if (profileReference) {
            return {
                type: profileReference.type,
                name: profileReference.name,
                isDefinition: false
            };
        }

        return null;
    }

    private findProfileTypeFromContext(document: vscode.TextDocument, editLine: number): string | null {
        // Stack-based approach to handle nested structures correctly
        const stack: Array<{ type: 'config' | 'edit', line: number, text: string }> = [];
        
        // Replay the structure up to the editLine to determine the correct context
        for (let i = 0; i <= editLine; i++) {
            const line = document.lineAt(i);
            const text = line.text.trim();

            // Handle config statements - push to stack
            const configMatch = text.match(/^config\s+(.+)/);
            if (configMatch) {
                stack.push({ type: 'config', line: i, text: text });
                continue;
            }

            // Handle edit statements - push to stack
            const editMatch = text.match(/^edit\s+"?([^"\s]+)"?/);
            if (editMatch) {
                stack.push({ type: 'edit', line: i, text: text });
                continue;
            }

            // Handle end statements - pop from stack if it's a config
            if (text === 'end') {
                if (stack.length > 0) {
                    const lastElement = stack[stack.length - 1];
                    if (lastElement.type === 'config') {
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

        // Find the most recent config in the stack
        for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].type === 'config') {
                const configText = stack[i].text;
                // Check for config patterns
                for (const [profileType, pattern] of Object.entries(this.PROFILE_PATTERNS)) {
                    if (pattern.test(configText)) {
                        return profileType;
                    }
                }
            }
        }

        return null;
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

        return null;
    }

    private findAllReferences(document: vscode.TextDocument, profileType: string, profileName: string): vscode.Location[] {
        const references: vscode.Location[] = [];
        const configPattern = this.PROFILE_PATTERNS[profileType];
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
                
                // Check if this is the profile definition we're looking for
                if (inTargetConfigSection && editMatch[1] === profileName) {
                    const range = new vscode.Range(i, 0, i, text.length);
                    references.push(new vscode.Location(document.uri, range));
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

            // Look for set commands that reference this profile
            const setPattern = new RegExp(`set\\s+${profileType}\\s+"?${this.escapeRegExp(profileName)}"?`);
            const setMatch = text.match(setPattern);

            if (setMatch) {
                const startPos = line.text.indexOf(setMatch[0]);
                const range = new vscode.Range(
                    i,
                    startPos,
                    i,
                    startPos + setMatch[0].length
                );
                references.push(new vscode.Location(document.uri, range));
            }
        }

        return references;
    }

    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}