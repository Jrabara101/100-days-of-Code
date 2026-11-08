import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, GripVertical, Check, AlertCircle } from 'lucide-react';
import { sounds } from '../../services/audioEffects';

interface DragDropSequenceQuestionProps {
  initialItems: { id: string; content: string }[];
  currentOrder: string[]; // array of item IDs
  isSubmitted: boolean;
  correctOrder?: string[];
  onChangeOrder: (newOrder: string[]) => void;
}

export const DragDropSequenceQuestion: React.FC<DragDropSequenceQuestionProps> = ({
  initialItems,
  currentOrder,
  isSubmitted,
  correctOrder,
  onChangeOrder
}) => {
  // If currentOrder is empty, initialize with initial scrambled IDs
  useEffect(() => {
    if (!currentOrder || currentOrder.length === 0) {
      onChangeOrder(initialItems.map(item => item.id));
    }
  }, [initialItems, currentOrder, onChangeOrder]);

  const itemsMap = React.useMemo(() => {
    return new Map(initialItems.map(item => [item.id, item.content]));
  }, [initialItems]);

  const activeOrder = currentOrder && currentOrder.length > 0
    ? currentOrder
    : initialItems.map(item => item.id);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (isSubmitted) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeOrder.length) return;

    sounds.playClick();
    const newArr = [...activeOrder];
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;
    onChangeOrder(newArr);
  };

  return (
    <div className="space-y-2.5">
      <div className="text-[11px] font-mono text-slate-500 mb-2">
        Click arrows or drag steps to reorder into the correct sequential lifecycle:
      </div>

      {activeOrder.map((id, index) => {
        const content = itemsMap.get(id) || '';
        const isItemInCorrectPos = isSubmitted && correctOrder && correctOrder[index] === id;

        let borderClass = 'border-black/10 dark:border-white/10 bg-white dark:bg-[#171B26]';
        if (isSubmitted) {
          borderClass = isItemInCorrectPos
            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100'
            : 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-100';
        }

        return (
          <div
            key={id}
            className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 shadow-xs ${borderClass}`}
          >
            {/* Step Order Badge */}
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
              {index + 1}
            </div>

            {/* Grip Icon */}
            <GripVertical className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />

            {/* Step Text Content */}
            <div className="flex-1 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {content}
            </div>

            {/* Up / Down Controls */}
            {!isSubmitted ? (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveItem(index, 'up')}
                  className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 text-slate-600 dark:text-slate-300"
                  title="Move step earlier"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === activeOrder.length - 1}
                  onClick={() => moveItem(index, 'down')}
                  className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 text-slate-600 dark:text-slate-300"
                  title="Move step later"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="shrink-0 font-mono text-xs">
                {isItemInCorrectPos ? (
                  <span className="text-emerald-500 flex items-center gap-1 font-bold">
                    <Check className="w-4 h-4" /> Correct Step
                  </span>
                ) : (
                  <span className="text-amber-500 flex items-center gap-1 font-bold">
                    Expected #{correctOrder ? correctOrder.indexOf(id) + 1 : index + 1}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

