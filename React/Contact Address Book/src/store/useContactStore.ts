import { create } from 'zustand';
import { Contact, MutationRecord } from '../types/contact';
import { ContactTrieIndex } from '../engine/trieIndex';
import { generateContacts } from '../data/seedContacts';

interface ContactStoreState {
  contacts: Record<string, Contact>;
  allIds: string[];
  filteredIds: string[];
  searchQuery: string;
  activeCluster: string | null;
  selectedContactId: string | null;
  isInspectorOpen: boolean;
  viewMode: 'grid' | 'table';
  
  // Netcode & Optimistic State
  previousState: {
    contacts: Record<string, Contact>;
    allIds: string[];
  } | null;
  mutationStream: MutationRecord[];
  isRollbackBannerVisible: boolean;
  rollbackReason: string;
  isRollingBack: boolean;

  // Telemetry
  queryLatencyMs: number;
  trieNodeCount: number;
  domMountCount: number;
  fps: number;
  memoryMb: number;

  // Actions
  setSearchQuery: (query: string) => void;
  setActiveCluster: (cluster: string | null) => void;
  selectContact: (id: string | null) => void;
  setInspectorOpen: (open: boolean) => void;
  setViewMode: (mode: 'grid' | 'table') => void;
  setDomMountCount: (count: number) => void;
  setFps: (fps: number) => void;
  dismissRollbackBanner: () => void;

  // Optimistic Mutations
  assignGroupOptimistic: (contactId: string, targetCluster: string) => void;
  updateContactOptimistic: (id: string, updates: Partial<Contact>) => void;
  deleteContactOptimistic: (id: string) => void;
  addContactOptimistic: (newContact: Contact) => void;
  confirmMutation: () => void;
  rollbackMutation: (reason?: string) => void;
  triggerRollbackSimulation: () => void;

  // Bulk / Scale
  scaleDataset: (count: number) => void;
  rebuildIndex: () => void;
}

// Global In-memory Trie Engine Instance
const trieIndex = new ContactTrieIndex();

// Seed initial 1,500 contacts
const initialList = generateContacts(1500);
const initialContacts: Record<string, Contact> = {};
const initialAllIds: string[] = [];

for (const c of initialList) {
  initialContacts[c.id] = c;
  initialAllIds.push(c.id);
}

// Initial index build
trieIndex.build(initialList);

export const useContactStore = create<ContactStoreState>((set, get) => ({
  contacts: initialContacts,
  allIds: initialAllIds,
  filteredIds: initialAllIds,
  searchQuery: '',
  activeCluster: null,
  selectedContactId: null,
  isInspectorOpen: false,
  viewMode: 'grid',

  previousState: null,
  mutationStream: [
    {
      id: 'tx-init',
      tx: 'TX::TRIE_INDEX_INITIALIZED',
      type: 'PROVISION',
      timestamp: 'just now',
      latencyMs: 0.12,
      status: 'COMMITTED',
      details: 'Indexed 1,500 nodes into 0-alloc prefix trie.',
    },
  ],
  isRollbackBannerVisible: false,
  rollbackReason: '',
  isRollingBack: false,

  queryLatencyMs: 0.14,
  trieNodeCount: trieIndex.getNodeCount(),
  domMountCount: 16,
  fps: 60,
  memoryMb: 14.2,

  setSearchQuery: (query) => {
    const { activeCluster } = get();
    const { matches, executionTimeMs } = trieIndex.search(query, activeCluster);
    set({
      searchQuery: query,
      filteredIds: matches,
      queryLatencyMs: executionTimeMs,
    });
  },

  setActiveCluster: (cluster) => {
    const { searchQuery } = get();
    const cleanCluster = cluster === 'ALL' ? null : cluster;
    const { matches, executionTimeMs } = trieIndex.search(searchQuery, cleanCluster);
    set({
      activeCluster: cleanCluster,
      filteredIds: matches,
      queryLatencyMs: executionTimeMs,
    });
  },

  selectContact: (id) => {
    set({
      selectedContactId: id,
      isInspectorOpen: id !== null,
    });
  },

  setInspectorOpen: (open) => {
    set((state) => ({
      isInspectorOpen: open,
      selectedContactId: open ? state.selectedContactId : null,
    }));
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setDomMountCount: (count) => set({ domMountCount: count }),
  setFps: (fps) => set({ fps }),
  dismissRollbackBanner: () => set({ isRollbackBannerVisible: false }),

  // Optimistic Group Assignment (Drag and Drop Netcode)
  assignGroupOptimistic: (contactId, targetCluster) => {
    const state = get();
    const target = state.contacts[contactId];
    if (!target || target.cluster === targetCluster) return;

    const start = performance.now();
    const prevContacts = { ...state.contacts };
    const prevAllIds = [...state.allIds];

    const updatedContact: Contact = {
      ...target,
      cluster: targetCluster,
      groupId: targetCluster,
      updatedAt: Date.now(),
    };

    // Update in-memory trie
    trieIndex.remove(contactId);
    trieIndex.insert(updatedContact);

    const newContacts = {
      ...state.contacts,
      [contactId]: updatedContact,
    };

    const { matches, executionTimeMs } = trieIndex.search(state.searchQuery, state.activeCluster);

    const txRecord: MutationRecord = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      tx: `TX::ASSIGN_CLUSTER_${contactId}`,
      type: 'ASSIGN_GROUP',
      contactId,
      contactName: target.name,
      timestamp: 'just now',
      latencyMs: performance.now() - start,
      status: 'COMMITTED',
      details: `Relocated node to [${targetCluster}]`,
    };

    set({
      previousState: { contacts: prevContacts, allIds: prevAllIds },
      contacts: newContacts,
      filteredIds: matches,
      queryLatencyMs: executionTimeMs,
      mutationStream: [txRecord, ...state.mutationStream.slice(0, 24)],
    });
  },

  // Optimistic Update
  updateContactOptimistic: (id, updates) => {
    const state = get();
    const existing = state.contacts[id];
    if (!existing) return;

    const start = performance.now();
    const prevContacts = { ...state.contacts };
    const prevAllIds = [...state.allIds];

    const updated: Contact = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    trieIndex.remove(id);
    trieIndex.insert(updated);

    const newContacts = {
      ...state.contacts,
      [id]: updated,
    };

    const { matches, executionTimeMs } = trieIndex.search(state.searchQuery, state.activeCluster);

    const txRecord: MutationRecord = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      tx: `TX::MUTATE_NODE_${id}`,
      type: 'UPDATE',
      contactId: id,
      contactName: updated.name,
      timestamp: 'just now',
      latencyMs: performance.now() - start,
      status: 'COMMITTED',
      details: `Modified attributes: ${Object.keys(updates).join(', ')}`,
    };

    set({
      previousState: { contacts: prevContacts, allIds: prevAllIds },
      contacts: newContacts,
      filteredIds: matches,
      queryLatencyMs: executionTimeMs,
      mutationStream: [txRecord, ...state.mutationStream.slice(0, 24)],
    });
  },

  // Optimistic Deletion
  deleteContactOptimistic: (id) => {
    const state = get();
    const existing = state.contacts[id];
    if (!existing) return;

    const start = performance.now();
    const prevContacts = { ...state.contacts };
    const prevAllIds = [...state.allIds];

    trieIndex.remove(id);

    const newContacts = { ...state.contacts };
    delete newContacts[id];
    const newAllIds = state.allIds.filter((item) => item !== id);

    const { matches, executionTimeMs } = trieIndex.search(state.searchQuery, state.activeCluster);

    const txRecord: MutationRecord = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      tx: `TX::DECOMMISSION_NODE_${id}`,
      type: 'DELETE',
      contactId: id,
      contactName: existing.name,
      timestamp: 'just now',
      latencyMs: performance.now() - start,
      status: 'COMMITTED',
      details: `Purged entity from spatial trie`,
    };

    set({
      previousState: { contacts: prevContacts, allIds: prevAllIds },
      contacts: newContacts,
      allIds: newAllIds,
      filteredIds: matches,
      selectedContactId: state.selectedContactId === id ? null : state.selectedContactId,
      isInspectorOpen: state.selectedContactId === id ? false : state.isInspectorOpen,
      queryLatencyMs: executionTimeMs,
      trieNodeCount: trieIndex.getNodeCount(),
      mutationStream: [txRecord, ...state.mutationStream.slice(0, 24)],
    });
  },

  // Add Contact
  addContactOptimistic: (newContact) => {
    const state = get();
    const start = performance.now();

    trieIndex.insert(newContact);

    const newContacts = {
      [newContact.id]: newContact,
      ...state.contacts,
    };
    const newAllIds = [newContact.id, ...state.allIds];

    const { matches, executionTimeMs } = trieIndex.search(state.searchQuery, state.activeCluster);

    const txRecord: MutationRecord = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      tx: `TX::PROVISION_NODE_${newContact.id}`,
      type: 'PROVISION',
      contactId: newContact.id,
      contactName: newContact.name,
      timestamp: 'just now',
      latencyMs: performance.now() - start,
      status: 'COMMITTED',
      details: `Registered in cluster [${newContact.cluster}]`,
    };

    set({
      contacts: newContacts,
      allIds: newAllIds,
      filteredIds: matches,
      queryLatencyMs: executionTimeMs,
      trieNodeCount: trieIndex.getNodeCount(),
      mutationStream: [txRecord, ...state.mutationStream.slice(0, 24)],
    });
  },

  confirmMutation: () => set({ previousState: null }),

  rollbackMutation: (reason = 'Packet dropped on cluster shard #04. Vector clock mismatch [0x419A].') => {
    const state = get();
    if (!state.previousState) return;

    const start = performance.now();
    const revertedContacts = state.previousState.contacts;
    const revertedAllIds = state.previousState.allIds;

    // Rebuild trie with reverted state
    const contactList = Object.values(revertedContacts);
    trieIndex.build(contactList);

    const { matches, executionTimeMs } = trieIndex.search(state.searchQuery, state.activeCluster);

    const txRecord: MutationRecord = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      tx: `TX::RECONCILIATION_ROLLBACK`,
      type: 'ROLLBACK',
      timestamp: 'just now',
      latencyMs: performance.now() - start,
      status: 'ROLLED_BACK',
      details: `Restored ${revertedAllIds.length} nodes from local snapshot.`,
    };

    set({
      contacts: revertedContacts,
      allIds: revertedAllIds,
      filteredIds: matches,
      previousState: null,
      isRollbackBannerVisible: true,
      rollbackReason: reason,
      isRollingBack: true,
      queryLatencyMs: executionTimeMs,
      trieNodeCount: trieIndex.getNodeCount(),
      mutationStream: [txRecord, ...state.mutationStream.slice(0, 24)],
    });

    // Reset rubber-band animation state after 900ms
    setTimeout(() => {
      set({ isRollingBack: false });
    }, 900);
  },

  triggerRollbackSimulation: () => {
    const state = get();
    if (state.allIds.length === 0) return;

    const randomId = state.allIds[0];
    const contact = state.contacts[randomId];
    if (!contact) return;

    // Step 1: Optimistically change cluster to simulate an in-flight mutation
    const targetCluster = contact.cluster === 'Engineering Core' ? 'High Priority Nodes' : 'Engineering Core';
    state.assignGroupOptimistic(randomId, targetCluster);

    // Step 2: After 450ms, simulate network failure and rollback
    setTimeout(() => {
      get().rollbackMutation(
        `Desync simulation: Packet dropped on shard #04 while syncing node ${contact.name}. Local mutation rolled back in 0.08ms.`
      );
    }, 450);
  },

  scaleDataset: (count: number) => {
    const list = generateContacts(count);
    const newContacts: Record<string, Contact> = {};
    const newAllIds: string[] = [];

    for (const c of list) {
      newContacts[c.id] = c;
      newAllIds.push(c.id);
    }

    trieIndex.build(list);
    const { matches, executionTimeMs } = trieIndex.search('', null);

    set({
      contacts: newContacts,
      allIds: newAllIds,
      filteredIds: matches,
      searchQuery: '',
      activeCluster: null,
      queryLatencyMs: executionTimeMs,
      trieNodeCount: trieIndex.getNodeCount(),
      memoryMb: Number((14.2 * (count / 1500)).toFixed(1)),
      mutationStream: [
        {
          id: `scale-${Date.now()}`,
          tx: `TX::MASS_SCALE_${count}`,
          type: 'PROVISION',
          timestamp: 'just now',
          latencyMs: executionTimeMs,
          status: 'COMMITTED',
          details: `Indexed ${count.toLocaleString()} nodes into memory graph.`,
        },
        ...get().mutationStream.slice(0, 20),
      ],
    });
  },

  rebuildIndex: () => {
    const state = get();
    const list = Object.values(state.contacts);
    const duration = trieIndex.build(list);
    const { matches } = trieIndex.search(state.searchQuery, state.activeCluster);
    set({
      filteredIds: matches,
      queryLatencyMs: duration,
      trieNodeCount: trieIndex.getNodeCount(),
    });
  },
}));
