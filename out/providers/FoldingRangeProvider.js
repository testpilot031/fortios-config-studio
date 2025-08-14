"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FortiOSFoldingRangeProvider = void 0;
const vscode = require("vscode");
class FortiOSFoldingRangeProvider {
    provideFoldingRanges(document, context, token) {
        const foldingRanges = [];
        const configStack = [];
        const editStack = [];
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const text = line.text.trim();
            // Handle config blocks
            if (/^config\s/.test(text)) {
                configStack.push(i);
            }
            else if (text === 'end' && configStack.length > 0) {
                const startLine = configStack.pop();
                foldingRanges.push(new vscode.FoldingRange(startLine, i, vscode.FoldingRangeKind.Region));
            }
            // Handle edit blocks
            if (/^edit\s/.test(text)) {
                editStack.push(i);
            }
            else if (text === 'next' && editStack.length > 0) {
                const startLine = editStack.pop();
                foldingRanges.push(new vscode.FoldingRange(startLine, i, vscode.FoldingRangeKind.Region));
            }
        }
        return foldingRanges;
    }
}
exports.FortiOSFoldingRangeProvider = FortiOSFoldingRangeProvider;
//# sourceMappingURL=FoldingRangeProvider.js.map