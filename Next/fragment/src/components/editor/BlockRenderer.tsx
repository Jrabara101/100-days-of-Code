'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useDocumentStore } from '@/store/useDocumentStore';
import React, { useEffect, useState } from 'react';
import { SlashMenu } from './SlashMenu';
import { BlockType } from '@/types/schema';
import { CheckSquare } from 'lucide-react';
import { cn } from '@/utils/cn';

export const BlockRenderer = React.memo(({ id }: { id: string }) => {
    const block = useDocumentStore((state) => state.blocks[id]);
    const updateBlockContent = useDocumentStore((state) => state.updateBlockContent);
    const updateBlockType = useDocumentStore((state) => state.updateBlockType);
    const addBlock = useDocumentStore((state) => state.addBlock);
    const indentBlock = useDocumentStore((state) => state.indentBlock);
    const outdentBlock = useDocumentStore((state) => state.outdentBlock);
    const focusedId = useDocumentStore((state) => state.focusedId);

    // Slash Menu State
    const [slashMenuPosition, setSlashMenuPosition] = useState<{ top: number; left: number } | null>(null);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: block?.type === 'text' ? "Type '/' for commands" : `Heading ${block?.type.replace('h', '')}`,
                emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-gray-400 before:float-left before:pointer-events-none',
            })
        ],
        content: block?.content || '',
        onUpdate: ({ editor }) => {
            updateBlockContent(id, editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: cn(
                    'prose prose-slate focus:outline-none max-w-none w-full min-h-[1.5em] transition-all',
                    // Dynamic styling based on block type
                    block?.type === 'h1' && 'text-3xl font-bold mt-4 mb-2',
                    block?.type === 'h2' && 'text-2xl font-bold mt-3 mb-1',
                    block?.type === 'h3' && 'text-xl font-bold mt-2',
                    block?.type === 'bullet' && 'list-disc ml-4',
                    block?.type === 'todo' && 'ml-2',
                ),
            },
            handleKeyDown: (view, event) => {
                // Slash Menu Trigger
                if (event.key === '/') {
                    const { top, left } = view.coordsAtPos(view.state.selection.from);
                    setSlashMenuPosition({ top: top + 20, left });
                    // Don't prevent default, let the '/' be typed, we will clear it on select
                }

                if (event.key === 'Enter' && !event.shiftKey && !slashMenuPosition) {
                    event.preventDefault();

                    const parentId = block.parentId;
                    let index = 0;

                    if (parentId) {
                        const state = useDocumentStore.getState();
                        const parentBlock = state.blocks[parentId];
                        if (parentBlock) {
                            index = parentBlock.childrenIds.indexOf(id) + 1;
                        }
                    } else {
                        const state = useDocumentStore.getState();
                        index = state.rootOrder.indexOf(id) + 1;
                    }

                    addBlock(parentId, index, 'text'); // Next block is always text by default
                    return true;
                }

                // Nesting Shortcuts
                if (event.key === 'Tab') {
                    event.preventDefault();
                    if (event.shiftKey) {
                        outdentBlock(id);
                    } else {
                        indentBlock(id);
                    }
                    return true;
                }

                if (event.key === 'Backspace' && editor && editor.isEmpty) {
                    // Standard TipTap behavior handles most, but we might want to merge up manually or outdent
                    if (block.childrenIds.length === 0 && block.type !== 'text') {
                        // Reset to text if empty and strictly Typed
                        updateBlockType(id, 'text');
                        return true;
                    }
                    if (block.parentId) {
                        // If at start of indented block, outdent?
                        // For now let's stick to shift+tab for outdent to avoid accidental moves
                    }
                }

                return false;
            }
        },
    });

    useEffect(() => {
        if (editor && focusedId === id) {
            editor.commands.focus();
        }
    }, [editor, focusedId, id]);

    // Update editor class if type changes
    useEffect(() => {
        // Force re-render of placeholder
        if (editor) {
            // Tiptap handles content, but we might need to reset styles or re-configure placeholder if we were strict. 
            // Currently using React key or class updates.
        }
    }, [block?.type, editor]);

    if (!block) return null;

    const handleMenuSelect = (type: BlockType) => {
        updateBlockType(id, type);
        setSlashMenuPosition(null);
        // Remove the '/' character if it exists at the end
        if (editor) {
            const { from } = editor.state.selection;
            editor.commands.deleteRange({ from: from - 1, to: from });
            editor.commands.focus();
        }
    };

    return (
        <div className="relative group flex items-start w-full">
            {/* Todo Checkbox */}
            {block.type === 'todo' && (
                <div
                    contentEditable={false}
                    className="mt-1.5 mr-2 cursor-pointer text-gray-400 hover:text-blue-500"
                    onClick={() => {
                        // Toggle todo state (simplified)
                        // We would need an action updateBlockMetadata(id, { checked: !checked })
                    }}
                >
                    <CheckSquare size={16} />
                </div>
            )}

            <EditorContent editor={editor} className="flex-1" />

            {slashMenuPosition && (
                <SlashMenu
                    position={slashMenuPosition}
                    onSelect={handleMenuSelect}
                    onClose={() => setSlashMenuPosition(null)}
                />
            )}
        </div>
    );
}, (prev, next) => {
    return prev.id === next.id;
});
