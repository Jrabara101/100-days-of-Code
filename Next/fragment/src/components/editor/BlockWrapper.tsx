'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlockRenderer } from './BlockRenderer';
import { GripVertical } from 'lucide-react';
import { useDocumentStore } from '@/store/useDocumentStore';

export function BlockWrapper({ id }: { id: string }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const block = useDocumentStore((state) => state.blocks[id]); // Needed to render children

    // We only want to render root blocks in the main loop of EditorCanvas.
    // Children are rendered recursively here.

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
    };

    if (!block) return null;

    return (
        <div ref={setNodeRef} style={style} className="group relative flex flex-col items-start w-full">
            <div className="flex items-start w-full gap-2">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    contentEditable={false}
                    className="mt-1.5 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-opacity select-none"
                    aria-label="Drag block"
                >
                    <GripVertical size={16} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <BlockRenderer id={id} />
                </div>
            </div>

            {/* Nested Children */}
            {block.childrenIds && block.childrenIds.length > 0 && (
                <div className="pl-6 border-l border-gray-100 ml-2 w-full mt-1">
                    {block.childrenIds.map(childId => (
                        <BlockWrapper key={childId} id={childId} />
                    ))}
                </div>
            )}
        </div>
    );
}
