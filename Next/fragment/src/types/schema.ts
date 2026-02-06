export type BlockType = 'text' | 'h1' | 'h2' | 'h3' | 'todo' | 'bullet' | 'image' | 'code';

export interface Block {
    id: string;
    type: BlockType;
    content: string; // HTML or JSON string from TipTap
    parentId: string | null;
    childrenIds: string[];
    metadata?: Record<string, any>;
}

export interface DocumentState {
    blocks: Record<string, Block>; // O(1) Lookup
    rootOrder: string[];           // Top-level block IDs
}
