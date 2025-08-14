"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FortiOSBracketMatchingProvider = void 0;
const vscode = require("vscode");
class FortiOSBracketMatchingProvider {
    provideDocumentHighlights(document, position, token) {
        const line = document.lineAt(position.line);
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return [];
        }
        const word = document.getText(wordRange);
        const highlights = [];
        // Add current word highlight
        highlights.push(new vscode.DocumentHighlight(wordRange, vscode.DocumentHighlightKind.Text));
        // Find matching pairs
        if (word === 'config') {
            const matchingEnd = this.findMatchingEnd(document, position.line, 'config', 'end');
            if (matchingEnd !== -1) {
                const endLine = document.lineAt(matchingEnd);
                const endRange = new vscode.Range(matchingEnd, endLine.text.indexOf('end'), matchingEnd, endLine.text.indexOf('end') + 3);
                highlights.push(new vscode.DocumentHighlight(endRange, vscode.DocumentHighlightKind.Text));
            }
        }
        else if (word === 'end') {
            const matchingConfig = this.findMatchingStart(document, position.line, 'end', 'config');
            if (matchingConfig !== -1) {
                const configLine = document.lineAt(matchingConfig);
                const configRange = new vscode.Range(matchingConfig, configLine.text.indexOf('config'), matchingConfig, configLine.text.indexOf('config') + 6);
                highlights.push(new vscode.DocumentHighlight(configRange, vscode.DocumentHighlightKind.Text));
            }
        }
        else if (word === 'edit') {
            const matchingNext = this.findMatchingEnd(document, position.line, 'edit', 'next');
            if (matchingNext !== -1) {
                const nextLine = document.lineAt(matchingNext);
                const nextRange = new vscode.Range(matchingNext, nextLine.text.indexOf('next'), matchingNext, nextLine.text.indexOf('next') + 4);
                highlights.push(new vscode.DocumentHighlight(nextRange, vscode.DocumentHighlightKind.Text));
            }
        }
        else if (word === 'next') {
            const matchingEdit = this.findMatchingStart(document, position.line, 'next', 'edit');
            if (matchingEdit !== -1) {
                const editLine = document.lineAt(matchingEdit);
                const editRange = new vscode.Range(matchingEdit, editLine.text.indexOf('edit'), matchingEdit, editLine.text.indexOf('edit') + 4);
                highlights.push(new vscode.DocumentHighlight(editRange, vscode.DocumentHighlightKind.Text));
            }
        }
        return highlights;
    }
    findMatchingEnd(document, startLine, startKeyword, endKeyword) {
        let depth = 0;
        for (let i = startLine; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const text = line.text.trim();
            if (new RegExp(`^${startKeyword}\\s`).test(text)) {
                depth++;
            }
            else if (text === endKeyword) {
                depth--;
                if (depth === 0) {
                    return i;
                }
            }
        }
        return -1;
    }
    findMatchingStart(document, endLine, endKeyword, startKeyword) {
        let depth = 0;
        for (let i = endLine; i >= 0; i--) {
            const line = document.lineAt(i);
            const text = line.text.trim();
            if (text === endKeyword) {
                depth++;
            }
            else if (new RegExp(`^${startKeyword}\\s`).test(text)) {
                depth--;
                if (depth === 0) {
                    return i;
                }
            }
        }
        return -1;
    }
}
exports.FortiOSBracketMatchingProvider = FortiOSBracketMatchingProvider;
//# sourceMappingURL=BracketMatchingProvider.js.map