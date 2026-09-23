import React from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from './ui/Command';
import { useContactStore } from '../store/useContactStore';
import { CLUSTERS } from '../data/seedContacts';
import {
  UserPlus,
  Radio,
  Download,
  Filter,
  Layers,
  Zap,
} from 'lucide-react';

interface CommandPaletteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenAddNode: () => void;
  onOpenExport: () => void;
  onShowToast: (msg: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  open,
  onOpenChange,
  onOpenAddNode,
  onOpenExport,
  onShowToast,
}) => {
  const contacts = useContactStore((state) => state.contacts);
  const filteredIds = useContactStore((state) => state.filteredIds);
  const selectContact = useContactStore((state) => state.selectContact);
  const setActiveCluster = useContactStore((state) => state.setActiveCluster);
  const triggerRollbackSimulation = useContactStore(
    (state) => state.triggerRollbackSimulation
  );
  const scaleDataset = useContactStore((state) => state.scaleDataset);
  const allIds = useContactStore((state) => state.allIds);

  const topContacts = filteredIds.slice(0, 10).map((id) => contacts[id]).filter(Boolean);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command, cluster name, or search contact..." />
      <CommandList>
        <CommandEmpty>No matching command or indexed node found.</CommandEmpty>

        {/* System Operations */}
        <CommandGroup heading="System Operations">
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              onOpenAddNode();
            }}
          >
            <UserPlus className="mr-2 h-4 w-4 text-primary" />
            <span>Provision New Node</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              triggerRollbackSimulation();
              onShowToast('Triggered optimistic desync rollback simulation');
            }}
          >
            <Radio className="mr-2 h-4 w-4 text-error animate-pulse" />
            <span>Simulate Netcode Rollback (Rubber-band)</span>
            <CommandShortcut>⌘R</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              scaleDataset(allIds.length >= 5000 ? 1500 : 5000);
              onShowToast(`Spatial index scaled to ${allIds.length >= 5000 ? '1,500' : '5,000'} nodes`);
            }}
          >
            <Zap className="mr-2 h-4 w-4 text-tertiary" />
            <span>{allIds.length >= 5000 ? 'Reset Scale to 1,500 Nodes' : 'Scale Engine to 5,000 Nodes'}</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              onOpenExport();
            }}
          >
            <Download className="mr-2 h-4 w-4 text-on-surface-variant" />
            <span>Export Bitset / vCard Directory</span>
            <CommandShortcut>⌘E</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Cluster Partitions */}
        <CommandGroup heading="Filter by Cluster">
          <CommandItem
            onSelect={() => {
              setActiveCluster(null);
              onOpenChange(false);
              onShowToast('Filter cleared: Showing All Entities');
            }}
          >
            <Layers className="mr-2 h-4 w-4 text-primary" />
            <span>Show All Entities</span>
          </CommandItem>

          {CLUSTERS.map((cluster) => (
            <CommandItem
              key={cluster.id}
              onSelect={() => {
                setActiveCluster(cluster.id);
                onOpenChange(false);
                onShowToast(`Filtered cluster: ${cluster.name}`);
              }}
            >
              <Filter className="mr-2 h-4 w-4 text-on-surface-variant" />
              <span>{cluster.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Node Jump */}
        <CommandGroup heading="Indexed Nodes (Quick Jump)">
          {topContacts.map((c) => (
            <CommandItem
              key={c.id}
              onSelect={() => {
                selectContact(c.id);
                onOpenChange(false);
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="font-semibold text-on-surface">{c.name}</span>
                  <span className="text-outline text-[11px]">{c.role}</span>
                </div>
                <span className="text-outline text-[10px]">{c.idx}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
