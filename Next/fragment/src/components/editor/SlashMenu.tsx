'use client';
import { useEffect, useState, useRef } from 'react';
import { Heading1, Heading2, Heading3, Type, CheckSquare, List } from 'lucide-react';
import { BlockType } from '@/types/schema';

interface SlashMenuProps {
    position: { top: number; left: number } | null;
    onSelect: (type: BlockType) => void;
    onClose: () => void;
}

const MENU_ITEMS: { type: BlockType; label: string; icon: any }[] = [
    { type: 'text', label: 'Text', icon: Type },
    { type: 'h1', label: 'Heading 1', icon: Heading1 },
    { type: 'h2', label: 'Heading 2', icon: Heading2 },
    { type: 'h3', label: 'Heading 3', icon: Heading3 },
    { type: 'todo', label: 'To-do List', icon: CheckSquare },
    { type: 'bullet', label: 'Bullet List', icon: List },
];

export function SlashMenu({ position, onSelect, onClose }: SlashMenuProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!position) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % MENU_ITEMS.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                onSelect(MENU_ITEMS[selectedIndex].type);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [position, selectedIndex, onSelect, onClose]);

    if (!position) return null;

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
            style={{ top: position.top, left: position.left }}
        >
            <div className="p-1">
                <div className="text-xs text-gray-400 font-semibold px-2 py-1 uppercase tracking-wider">
                    Turn into
                </div>
                {MENU_ITEMS.map((item, index) => (
                    <button
                        key={item.type}
                        onClick={() => onSelect(item.type)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <item.icon size={16} />
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
