import * as vscode from 'vscode';

export class CommentToggleCommand {
    static register(context: vscode.ExtensionContext): void {
        const disposable = vscode.commands.registerCommand('fortios.toggleComment', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const document = editor.document;
            const selections = editor.selections;

            editor.edit(editBuilder => {
                selections.forEach(selection => {
                    if (selection.isEmpty) {
                        // Single line comment toggle
                        const line = document.lineAt(selection.start.line);
                        CommentToggleCommand.toggleLineComment(editBuilder, line);
                    } else {
                        // Multiple line comment toggle
                        for (let i = selection.start.line; i <= selection.end.line; i++) {
                            const line = document.lineAt(i);
                            CommentToggleCommand.toggleLineComment(editBuilder, line);
                        }
                    }
                });
            });
        });

        context.subscriptions.push(disposable);
    }

    private static toggleLineComment(editBuilder: vscode.TextEditorEdit, line: vscode.TextLine): void {
        const text = line.text;
        const trimmed = text.trim();

        if (trimmed === '') {
            return; // Skip empty lines
        }

        // Check if line is already commented
        if (trimmed.startsWith('#')) {
            // Remove # comment
            const hashIndex = text.indexOf('#');
            const range = new vscode.Range(line.lineNumber, hashIndex, line.lineNumber, hashIndex + 1);
            editBuilder.delete(range);
            
            // Remove space after # if present
            if (text.charAt(hashIndex + 1) === ' ') {
                const spaceRange = new vscode.Range(line.lineNumber, hashIndex, line.lineNumber, hashIndex + 1);
                editBuilder.delete(spaceRange);
            }
        } else if (trimmed.startsWith('!')) {
            // Remove ! comment (Cisco ASA style)
            const exclamationIndex = text.indexOf('!');
            const range = new vscode.Range(line.lineNumber, exclamationIndex, line.lineNumber, exclamationIndex + 1);
            editBuilder.delete(range);
            
            // Remove space after ! if present
            if (text.charAt(exclamationIndex + 1) === ' ') {
                const spaceRange = new vscode.Range(line.lineNumber, exclamationIndex, line.lineNumber, exclamationIndex + 1);
                editBuilder.delete(spaceRange);
            }
        } else {
            // Add # comment
            const firstNonWhitespace = line.firstNonWhitespaceCharacterIndex;
            const insertPosition = new vscode.Position(line.lineNumber, firstNonWhitespace);
            editBuilder.insert(insertPosition, '# ');
        }
    }
}