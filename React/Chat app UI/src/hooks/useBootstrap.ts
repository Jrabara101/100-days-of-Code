import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { wsClient } from '../lib/wsClient';
import { usePresenceStore } from '../stores/usePresenceStore';
import { useChatWorkspaceStore } from '../stores/useChatWorkspaceStore';

export function useBootstrap() {
  const queryClient = useQueryClient();
  const setUsers = usePresenceStore((s) => s.setUsers);
  const hydrateFromIdb = useChatWorkspaceStore((s) => s.hydrateFromIdb);
  const setBookmarkedIds = useChatWorkspaceStore((s) => s.setBookmarkedIds);

  const query = useQuery({
    queryKey: ['bootstrap'],
    queryFn: api.bootstrap,
    staleTime: 60_000,
    retry: 2,
  });

  useEffect(() => {
    void hydrateFromIdb();
    wsClient.attachQueryClient(queryClient);
    wsClient.connect();
  }, [hydrateFromIdb, queryClient]);

  useEffect(() => {
    if (!query.data) return;
    setUsers(query.data.users);
    setBookmarkedIds(query.data.bookmarkedIds);
    queryClient.setQueryData(['conversations'], query.data.conversations);
    queryClient.setQueryData(['contacts'], query.data.contacts);
  }, [query.data, queryClient, setUsers, setBookmarkedIds]);

  return query;
}

