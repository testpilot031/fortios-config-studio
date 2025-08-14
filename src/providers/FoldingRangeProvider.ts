import * as vscode from 'vscode';

export class FortiOSFoldingRangeProvider implements vscode.FoldingRangeProvider {
    provideFoldingRanges(
        document: vscode.TextDocument,
        context: vscode.FoldingContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.FoldingRange[]> {
        const foldingRanges: vscode.FoldingRange[] = [];
        const configStack: number[] = [];
        const editStack: number[] = [];

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const text = line.text.trim();

            // Handle config blocks
            if (/^config\s/.test(text)) {
                configStack.push(i);
            } else if (text === 'end' && configStack.length > 0) {
                const startLine = configStack.pop()!;
                foldingRanges.push(new vscode.FoldingRange(startLine, i, vscode.FoldingRangeKind.Region));
            }

            // Handle edit blocks
            if (/^edit\s/.test(text)) {
                editStack.push(i);
            } else if (text === 'next' && editStack.length > 0) {
                const startLine = editStack.pop()!;
                foldingRanges.push(new vscode.FoldingRange(startLine, i, vscode.FoldingRangeKind.Region));
            }
        }

        return foldingRanges;
    }
}