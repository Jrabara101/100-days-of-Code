import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { BlockType, DocumentState } from '@/types/schema';

enableMapSet();

type Action = {
    addBlock: (parentId: string | null, index: number, type?: BlockType) => string;
    updateBlockContent: (id: string, content: string) => void;
    updateBlockType: (id: string, type: BlockType) => void;
    deleteBlock: (id: string) => void;
    moveBlock: (activeId: string, overId: string) => void;
    indentBlock: (id: string) => void;
    outdentBlock: (id: string) => void;
    setFocusedId: (id: string | null) => void;
    clearDirtyIds: (ids: string[]) => void;
};

type State = DocumentState & Action & {
    focusedId: string | null;
    dirtyBlockIds: Set<string>;
};

const INITIAL_ID = 'intro-block';

export const useDocumentStore = create<State>()(
    immer((set) => ({
        blocks: {
            [INITIAL_ID]: {
                id: INITIAL_ID,
                type: 'text',
                content: '<p>Welcome to Fragment</p>',
                parentId: null,
                childrenIds: [],
            }
        },
        rootOrder: [INITIAL_ID],
        focusedId: null,
        dirtyBlockIds: new Set(),

        addBlock: (parentId, index, type = 'text') => {
            const newId = uuidv4();
            set((state) => {
                // Create new block
                state.blocks[newId] = {
                    id: newId,
                    type,
                    content: '',
                    parentId,
                    childrenIds: [],
                };

                // Add to parent or root
                if (parentId) {
                    const parent = state.blocks[parentId];
                    if (parent) {
                        parent.childrenIds.splice(index, 0, newId);
                        state.dirtyBlockIds.add(parentId);
                    }
                } else {
                    state.rootOrder.splice(index, 0, newId);
                }
                state.dirtyBlockIds.add(newId);

                // Focus the new block
                state.focusedId = newId;
            });
            return newId;
        },

        updateBlockContent: (id, content) => {
            set((state) => {
                if (state.blocks[id]) {
                    state.blocks[id].content = content;
                    state.dirtyBlockIds.add(id);
                }
            });
        },

        updateBlockType: (id, type) => {
            set((state) => {
                const block = state.blocks[id];
                if (block) {
                    block.type = type;
                    // When changing type, we might want to sanitize content content or keep it.
                    // TipTap handles some of this, but for now we trust the flow.
                    if (type === 'todo') {
                        block.metadata = { ...block.metadata, checked: false };
                    }
                    state.dirtyBlockIds.add(id);
                }
            });
        },

        deleteBlock: (id) => {
            set((state) => {
                const block = state.blocks[id];
                if (!block) return;

                // Remove from parent
                if (block.parentId) {
                    const parent = state.blocks[block.parentId];
                    if (parent) {
                        parent.childrenIds = parent.childrenIds.filter(childId => childId !== id);
                        state.dirtyBlockIds.add(parent.id);
                    }
                } else {
                    state.rootOrder = state.rootOrder.filter(rootId => rootId !== id);
                }

                delete state.blocks[id];
                state.dirtyBlockIds.delete(id);
            });
        },

        moveBlock: (activeId, overId) => {
            set((state) => {
                const activeBlock = state.blocks[activeId];
                const overBlock = state.blocks[overId];

                if (!activeBlock || !overBlock) return;

                // Simple reorder within root for MVP
                if (!activeBlock.parentId && !overBlock.parentId) {
                    const oldIndex = state.rootOrder.indexOf(activeId);
                    const newIndex = state.rootOrder.indexOf(overId);

                    if (oldIndex !== -1 && newIndex !== -1) {
                        const [moved] = state.rootOrder.splice(oldIndex, 1);
                        state.rootOrder.splice(newIndex, 0, moved);
                    }
                }
            });
        },

        indentBlock: (id) => {
            set((state) => {
                const block = state.blocks[id];
                if (!block) return;

                const parentId = block.parentId;
                let siblings: string[];

                if (parentId) {
                    siblings = state.blocks[parentId].childrenIds;
                } else {
                    siblings = state.rootOrder;
                }

                const index = siblings.indexOf(id);
                if (index > 0) {
                    const prevSiblingId = siblings[index - 1];
                    const prevSibling = state.blocks[prevSiblingId];
                    if (prevSibling) {
                        // Remove from current parent/root
                        siblings.splice(index, 1);
                        // Add to new parent (previous sibling)
                        prevSibling.childrenIds.push(id);
                        block.parentId = prevSiblingId;

                        state.dirtyBlockIds.add(id);
                        state.dirtyBlockIds.add(prevSiblingId);
                        if (parentId) state.dirtyBlockIds.add(parentId);
                    }
                }
            });
        },

        outdentBlock: (id) => {
            set((state) => {
                const block = state.blocks[id];
                if (!block || !block.parentId) return;

                const currentParent = state.blocks[block.parentId];
                if (!currentParent) return;

                const grandParentId = currentParent.parentId;

                // Remove from current parent
                const indexInParent = currentParent.childrenIds.indexOf(id);
                currentParent.childrenIds.splice(indexInParent, 1);

                // Add to grandparent (or root)
                if (grandParentId) {
                    const grandParent = state.blocks[grandParentId];
                    const parentIndex = grandParent.childrenIds.indexOf(block.parentId);
                    grandParent.childrenIds.splice(parentIndex + 1, 0, id);
                    block.parentId = grandParentId;
                    state.dirtyBlockIds.add(grandParentId);
                } else {
                    const parentIndex = state.rootOrder.indexOf(block.parentId);
                    state.rootOrder.splice(parentIndex + 1, 0, id);
                    block.parentId = null;
                }

                state.dirtyBlockIds.add(id);
                state.dirtyBlockIds.add(currentParent.id);
            });
        },

        setFocusedId: (id) => {
            set((state) => {
                state.focusedId = id;
            });
        },

        clearDirtyIds: (ids: string[]) => {
            set((state) => {
                ids.forEach(id => state.dirtyBlockIds.delete(id));
            });
        }
    }))
);
