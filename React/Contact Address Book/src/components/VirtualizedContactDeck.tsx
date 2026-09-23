import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useContactStore } from '../store/useContactStore';
import { TactileCard } from './react-bits/TactileCard';
import { Badge } from './ui/Badge';
import {
  Mail,
  Phone,
  Copy,
  ChevronRight,
  MoreVertical,
  Trash2,
  Check,
  Wifi,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './ui/DropdownMenu';
import confetti from 'canvas-confetti';

interface VirtualizedContactDeckProps {
  onShowToast: (msg: string) => void;
}

export const VirtualizedContactDeck: React.FC<VirtualizedContactDeckProps> = ({
  onShowToast,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const contacts = useContactStore((state) => state.contacts);
  const filteredIds = useContactStore((state) => state.filteredIds);
  const viewMode = useContactStore((state) => state.viewMode);
  const selectContact = useContactStore((state) => state.selectContact);
  const selectedContactId = useContactStore((state) => state.selectedContactId);
  const deleteContactOptimistic = useContactStore(
    (state) => state.deleteContactOptimistic
  );
  const setDomMountCount = useContactStore((state) => state.setDomMountCount);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [columnCount, setColumnCount] = useState<number>(3);

  // Responsive column count calculation based on container width
  useEffect(() => {
    const handleResize = () => {
      if (!parentRef.current) return;
      const width = parentRef.current.clientWidth;
      if (viewMode === 'table') {
        setColumnCount(1);
      } else {
        if (width >= 1440) setColumnCount(4);
        else if (width >= 1024) setColumnCount(3);
        else if (width >= 640) setColumnCount(2);
        else setColumnCount(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Group filtered IDs into rows based on columnCount
  const rowData = useMemo(() => {
    const rows: string[][] = [];
    for (let i = 0; i < filteredIds.length; i += columnCount) {
      rows.push(filteredIds.slice(i, i + columnCount));
    }
    return rows;
  }, [filteredIds, columnCount]);

  const rowHeight = viewMode === 'table' ? 52 : 210;

  const rowVirtualizer = useVirtualizer({
    count: rowData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 4,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Track mounted DOM elements for engine telemetry
  useEffect(() => {
    const mountedCount = virtualItems.length * columnCount;
    setDomMountCount(Math.min(mountedCount, filteredIds.length));
  }, [virtualItems, columnCount, filteredIds.length, setDomMountCount]);

  const handleCopyNode = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const contact = contacts[id];
    if (!contact) return;
    navigator.clipboard.writeText(`${contact.name} <${contact.email}> [${contact.idx}]`);
    setCopiedId(id);
    onShowToast(`Copied identifier: ${contact.name}`);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleQuickMail = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    onShowToast(`Dispatched signal ping to: ${email}`);
  };

  const handleQuickCall = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    onShowToast(`Encrypted voice channel connected: ${phone}`);
  };

  return (
    <div
      ref={parentRef}
      className="flex-1 w-full h-full overflow-y-auto px-4 py-3 select-none"
      style={{
        contain: 'strict',
      }}
    >
      {filteredIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <span className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-outline mb-2">
            ∅
          </span>
          <p className="font-mono text-xs text-outline uppercase tracking-wider">
            NO MATCHING NODES IN SPATIAL INDEX
          </p>
          <p className="font-sans text-xs text-on-surface-variant mt-1">
            Try adjusting your search query or cluster filter.
          </p>
        </div>
      ) : (
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const rowIds = rowData[virtualRow.index] || [];

            const rowStyle: React.CSSProperties = {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translate3d(0, ${virtualRow.start}px, 0)`,
              ...(viewMode !== 'table'
                ? {
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                    gap: '0.75rem',
                  }
                : {}),
            };

            return (
              <div
                key={virtualRow.key}
                style={rowStyle}
                className={
                  viewMode === 'table'
                    ? 'flex items-center'
                    : ''
                }
              >
                {rowIds.map((id) => {
                  const contact = contacts[id];
                  if (!contact) return null;

                  const isSelected = selectedContactId === id;

                  // TABLE ROW VIEW
                  if (viewMode === 'table') {
                    return (
                      <div
                        key={id}
                        onClick={() => selectContact(id)}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', id);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-surface-container-high border-primary/50 text-on-surface'
                            : 'bg-surface-container-low/70 border-outline-variant/20 hover:bg-surface-container hover:border-outline-variant/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              contact.status === 'online'
                                ? 'bg-tertiary-container shadow-[0_0_6px_rgba(70,216,157,0.8)]'
                                : contact.status === 'busy'
                                ? 'bg-error-container'
                                : 'bg-outline'
                            }`}
                          />
                          <div className="flex flex-col truncate">
                            <span className="font-sans font-semibold text-on-surface truncate">
                              {contact.name}
                            </span>
                            <span className="font-mono text-[10px] text-outline truncate">
                              {contact.idx}
                            </span>
                          </div>
                        </div>

                        <div className="hidden md:flex flex-col min-w-[160px] truncate">
                          <span className="font-sans text-on-surface truncate">
                            {contact.role}
                          </span>
                          <span className="font-sans text-[11px] text-on-surface-variant truncate">
                            {contact.company}
                          </span>
                        </div>

                        <div className="hidden lg:flex items-center min-w-[140px]">
                          <Badge variant="primary">{contact.cluster}</Badge>
                        </div>

                        <div className="hidden xl:flex items-center gap-1 min-w-[180px]">
                          {contact.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 rounded bg-surface-container-highest text-[10px] font-mono text-outline"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => handleCopyNode(e, id)}
                            className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface"
                            title="Copy identifier"
                          >
                            {copiedId === id ? (
                              <Check className="w-3.5 h-3.5 text-tertiary" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={(e) => handleQuickMail(e, contact.email)}
                            className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface"
                            title="Quick mail"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-outline" />
                        </div>
                      </div>
                    );
                  }

                  // 4-COLUMN TACTILE CARD VIEW
                  return (
                    <TactileCard
                      key={id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', id);
                      }}
                      onClick={() => selectContact(id)}
                      className={`h-[198px] flex flex-col justify-between ${
                        isSelected ? 'border-primary ring-1 ring-primary/40' : ''
                      }`}
                    >
                      {/* Top Row: Avatar, Identity, Status, Options */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 truncate">
                          {/* Avatar with Status Pip */}
                          <div className="relative shrink-0">
                            <img
                              src={contact.avatarUrl}
                              alt={contact.name}
                              className="w-10 h-10 rounded-full bg-surface-container border border-outline-variant/40 object-cover"
                              loading="lazy"
                            />
                            <span
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface-container-lowest ${
                                contact.status === 'online'
                                  ? 'bg-tertiary-container shadow-[0_0_6px_rgba(70,216,157,0.9)]'
                                  : contact.status === 'busy'
                                  ? 'bg-error-container'
                                  : 'bg-outline'
                              }`}
                            />
                          </div>

                          {/* Name & Role */}
                          <div className="flex flex-col truncate">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-sans text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                                {contact.name}
                              </span>
                            </div>
                            <span className="font-sans text-[11px] text-on-surface-variant truncate">
                              {contact.role}
                            </span>
                            <span className="font-mono text-[9px] text-outline truncate">
                              {contact.company}
                            </span>
                          </div>
                        </div>

                        {/* Top Right Latency & Dropdown Menu */}
                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className="font-mono text-[9px] text-tertiary px-1 py-0.2 bg-surface-container rounded border border-outline-variant/20 flex items-center gap-0.5"
                            title="Signal latency"
                          >
                            <Wifi className="w-2.5 h-2.5" />
                            {contact.latency}ms
                          </span>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectContact(id);
                                }}
                              >
                                Open Inspector
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => handleCopyNode(e as any, id)}
                              >
                                Copy Identifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                destructive
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteContactOptimistic(id);
                                  onShowToast(`Decommissioned node: ${contact.name}`);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                Decommission
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Middle: Tags & Cluster */}
                      <div className="flex flex-col gap-1.5 py-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-outline">
                          <span className="truncate">{contact.cluster}</span>
                          <span className="text-outline/70 shrink-0">{contact.idx}</span>
                        </div>

                        <div className="flex flex-wrap gap-1 overflow-hidden h-5">
                          {contact.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.2 rounded bg-surface-container-high text-[10px] font-mono text-outline border border-outline-variant/20"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Actions: Instant Hover Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleQuickMail(e, contact.email)}
                            className="p-1 rounded hover:bg-primary-container/20 hover:text-primary text-outline transition-colors"
                            title={`Signal: ${contact.email}`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleQuickCall(e, contact.phone)}
                            className="p-1 rounded hover:bg-tertiary-container/20 hover:text-tertiary text-outline transition-colors"
                            title={`Encrypted Voice: ${contact.phone}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleCopyNode(e, id)}
                            className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
                            title="Copy Node ID"
                          >
                            {copiedId === id ? (
                              <Check className="w-3.5 h-3.5 text-tertiary" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectContact(id);
                          }}
                          className="flex items-center gap-0.5 text-[10px] font-mono text-primary hover:underline"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </TactileCard>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
