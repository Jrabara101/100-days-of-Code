'use client';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDocumentStore } from '@/store/useDocumentStore';
import { BlockWrapper } from './BlockWrapper';
import { usePersistence } from '@/hooks/usePersistence';

import { useEffect, useState } from 'react';

export function EditorCanvas() {
    usePersistence();
    const rootOrder = useDocumentStore((state) => state.rootOrder);
    const moveBlock = useDocumentStore((state) => state.moveBlock);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            moveBlock(active.id as string, over.id as string);
        }
    };

    if (!isMounted) {
        return (
            <div className="max-w-3xl mx-auto py-12 px-4 min-h-screen bg-white text-gray-900">
                <div className="flex flex-col gap-2 pb-32">
                    {rootOrder.map((id) => (
                        <BlockWrapper key={id} id={id} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-12 px-4 min-h-screen bg-white text-gray-900">
            <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={rootOrder} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-2 pb-32">
                        {rootOrder.map((id) => (
                            <BlockWrapper key={id} id={id} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
