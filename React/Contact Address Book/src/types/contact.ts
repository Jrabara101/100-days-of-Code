export type ContactStatus = 'online' | 'busy' | 'offline' | 'away';

export interface ContactRelationship {
  targetId: string;
  name: string;
  relation: 'manager' | 'peer' | 'collaborator' | 'lead' | 'node';
}

export interface Contact {
  id: string;
  idx: string;
  name: string;
  role: string;
  company: string;
  location: string;
  email: string;
  phone: string;
  matrix: string;
  latency: number;
  status: ContactStatus;
  cluster: string;
  groupId: string | null;
  tags: string[];
  avatarUrl: string;
  notes?: string[];
  relationships?: ContactRelationship[];
  updatedAt: number;
}

export interface ClusterInfo {
  id: string;
  name: string;
  color: string;
  dotColor: string;
  count: number;
}

export interface MutationRecord {
  id: string;
  tx: string;
  type: 'UPDATE' | 'ASSIGN_GROUP' | 'PROVISION' | 'DELETE' | 'ROLLBACK';
  contactId?: string;
  contactName?: string;
  timestamp: string;
  latencyMs: number;
  status: 'COMMITTED' | 'ROLLED_BACK' | 'PENDING';
  details: string;
}
