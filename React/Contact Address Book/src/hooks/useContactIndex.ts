import { useContactStore } from '../store/useContactStore';

export function useContactIndex() {
  const searchQuery = useContactStore((state) => state.searchQuery);
  const setSearchQuery = useContactStore((state) => state.setSearchQuery);
  const filteredIds = useContactStore((state) => state.filteredIds);
  const activeCluster = useContactStore((state) => state.activeCluster);
  const setActiveCluster = useContactStore((state) => state.setActiveCluster);
  const queryLatencyMs = useContactStore((state) => state.queryLatencyMs);
  const trieNodeCount = useContactStore((state) => state.trieNodeCount);
  const totalContacts = useContactStore((state) => state.allIds.length);

  return {
    searchQuery,
    setSearchQuery,
    filteredIds,
    activeCluster,
    setActiveCluster,
    queryLatencyMs,
    trieNodeCount,
    totalContacts,
    resultCount: filteredIds.length,
  };
}
