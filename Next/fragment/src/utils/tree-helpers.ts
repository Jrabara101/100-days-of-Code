import { Block, DocumentState } from '@/types/schema';

// Helper to convert normalized state to nested tree structure (e.g. for export)
export function buildTree(state: DocumentState): (Block & { children: any[] })[] {
    const rootBlocks = state.rootOrder
        .map(id => state.blocks[id])
        .filter(Boolean);

    const enrichBlock = (block: Block): Block & { children: any[] } => {
        const children = block.childrenIds
            ? block.childrenIds
                .map(id => state.blocks[id])
                .filter(Boolean)
                .map(enrichBlock)
            : [];

        return { ...block, children };
    };

    return rootBlocks.map(enrichBlock);
}
