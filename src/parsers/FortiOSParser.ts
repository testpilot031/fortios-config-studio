import * as vscode from 'vscode';

export interface ConfigBlock {
    type: 'config' | 'edit';
    name: string;
    fullPath: string;
    startLine: number;
    endLine: number;
    children: ConfigBlock[];
    parent?: ConfigBlock;
}

export class FortiOSParser {

    public parseDocument(document: vscode.TextDocument): ConfigBlock[] {
        const rootBlocks: ConfigBlock[] = [];
        const blockStack: ConfigBlock[] = [];

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const text = line.text.trim();

            // Parse config blocks
            const configMatch = text.match(/^config\s+(.+)$/);
            if (configMatch) {
                const configName = configMatch[1];
                const block: ConfigBlock = {
                    type: 'config',
                    name: configName,
                    fullPath: this.buildFullPath(blockStack, configName),
                    startLine: i,
                    endLine: -1,
                    children: []
                };

                if (blockStack.length > 0) {
                    block.parent = blockStack[blockStack.length - 1];
                    blockStack[blockStack.length - 1].children.push(block);
                } else {
                    rootBlocks.push(block);
                }

                blockStack.push(block);
                continue;
            }

            // Parse edit blocks
            const editMatch = text.match(/^edit\s+(.+)$/);
            if (editMatch) {
                const editName = editMatch[1].replace(/"/g, ''); // Remove quotes
                const block: ConfigBlock = {
                    type: 'edit',
                    name: editName,
                    fullPath: this.buildFullPath(blockStack, editName),
                    startLine: i,
                    endLine: -1,
                    children: []
                };

                if (blockStack.length > 0) {
                    block.parent = blockStack[blockStack.length - 1];
                    blockStack[blockStack.length - 1].children.push(block);
                } else {
                    rootBlocks.push(block);
                }

                blockStack.push(block);
                continue;
            }

            // Handle end - closes config blocks
            if (text === 'end') {
                if (blockStack.length > 0) {
                    // Find the most recent config block to close
                    for (let j = blockStack.length - 1; j >= 0; j--) {
                        if (blockStack[j].type === 'config') {
                            const configBlock = blockStack[j];
                            configBlock.endLine = i;
                            // Remove this config block and any edit blocks above it
                            blockStack.splice(j);
                            break;
                        }
                    }
                }
                continue;
            }

            // Handle next - closes edit blocks
            if (text === 'next') {
                if (blockStack.length > 0) {
                    // Find the most recent edit block to close
                    for (let j = blockStack.length - 1; j >= 0; j--) {
                        if (blockStack[j].type === 'edit') {
                            const editBlock = blockStack[j];
                            editBlock.endLine = i;
                            // Remove only this edit block
                            blockStack.splice(j, 1);
                            break;
                        }
                    }
                }
                continue;
            }
        }

        return rootBlocks;
    }

    private buildFullPath(stack: ConfigBlock[], currentName: string): string {
        const pathParts = stack.map(block => block.name);
        pathParts.push(currentName);
        return pathParts.join(' > ');
    }

    public getConfigSections(blocks: ConfigBlock[]): string[] {
        const sections = new Set<string>();

        const collectSections = (blocks: ConfigBlock[]) => {
            for (const block of blocks) {
                if (block.type === 'config') {
                    // Extract first word as section (e.g., "system global" -> "system")
                    const firstWord = block.name.split(' ')[0];
                    sections.add(firstWord);
                }

            }
        };

        collectSections(blocks);
        return Array.from(sections).sort();
    }

    public getBlocksBySection(blocks: ConfigBlock[], section: string): ConfigBlock[] {
        const result: ConfigBlock[] = [];

        const searchBlocks = (blocks: ConfigBlock[]) => {
            for (const block of blocks) {
                if (block.type === 'config' && block.name.startsWith(section)) {
                    result.push(block);
                }
                // if (block.children.length > 0) {
                //     searchBlocks(block.children);
                // }
            }
        };

        searchBlocks(blocks);
        return result;
    }
}