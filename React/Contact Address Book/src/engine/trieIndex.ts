import { Contact } from '../types/contact';

class TrieNode {
  children: Map<string, TrieNode> = new Map();
  // We store matched contact IDs at this node for prefix lookups
  contactIds: Set<string> = new Set();
}

export class ContactTrieIndex {
  private root: TrieNode = new TrieNode();
  private contactMap: Map<string, Contact> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private clusterIndex: Map<string, Set<string>> = new Map();
  private nodeCount: number = 1;

  constructor(contacts?: Contact[]) {
    if (contacts && contacts.length > 0) {
      this.build(contacts);
    }
  }

  /**
   * Tokenizes text into search terms
   */
  private tokenize(text: string): string[] {
    if (!text) return [];
    return text
      .toLowerCase()
      .split(/[\s,./_@-]+/)
      .filter((term) => term.length > 0);
  }

  /**
   * Clear the entire trie
   */
  public clear(): void {
    this.root = new TrieNode();
    this.contactMap.clear();
    this.tagIndex.clear();
    this.clusterIndex.clear();
    this.nodeCount = 1;
  }

  /**
   * Bulk build the trie index
   */
  public build(contacts: Contact[]): number {
    const startTime = performance.now();
    this.clear();

    for (let i = 0; i < contacts.length; i++) {
      this.insert(contacts[i]);
    }

    return performance.now() - startTime;
  }

  /**
   * Insert a single contact into the Trie and secondary indices
   */
  public insert(contact: Contact): void {
    this.contactMap.set(contact.id, contact);

    // Index cluster
    if (contact.cluster) {
      const clusterKey = contact.cluster.toLowerCase();
      if (!this.clusterIndex.has(clusterKey)) {
        this.clusterIndex.set(clusterKey, new Set());
      }
      this.clusterIndex.get(clusterKey)!.add(contact.id);
    }

    // Index tags
    if (contact.tags) {
      for (const tag of contact.tags) {
        const cleanTag = tag.toLowerCase().replace(/^#/, '');
        if (!this.tagIndex.has(cleanTag)) {
          this.tagIndex.set(cleanTag, new Set());
        }
        this.tagIndex.get(cleanTag)!.add(contact.id);
      }
    }

    // Index searchable fields: name, email, company, role, location, idx
    const terms = new Set<string>();
    for (const term of this.tokenize(contact.name)) terms.add(term);
    for (const term of this.tokenize(contact.email)) terms.add(term);
    for (const term of this.tokenize(contact.company)) terms.add(term);
    for (const term of this.tokenize(contact.role)) terms.add(term);
    for (const term of this.tokenize(contact.location)) terms.add(term);
    for (const term of this.tokenize(contact.idx)) terms.add(term);
    if (contact.phone) {
      terms.add(contact.phone.replace(/\D/g, ''));
    }

    for (const term of terms) {
      this.insertTerm(term, contact.id);
    }
  }

  private insertTerm(term: string, contactId: string): void {
    let curr = this.root;
    curr.contactIds.add(contactId);

    for (let i = 0; i < term.length; i++) {
      const char = term[i];
      if (!curr.children.has(char)) {
        curr.children.set(char, new TrieNode());
        this.nodeCount++;
      }
      curr = curr.children.get(char)!;
      curr.contactIds.add(contactId);
    }
  }

  /**
   * Remove a contact from the Trie and secondary indices
   */
  public remove(contactId: string): void {
    const contact = this.contactMap.get(contactId);
    if (!contact) return;

    this.contactMap.delete(contactId);

    // Remove from cluster index
    if (contact.cluster) {
      this.clusterIndex.get(contact.cluster.toLowerCase())?.delete(contactId);
    }

    // Remove from tag index
    if (contact.tags) {
      for (const tag of contact.tags) {
        this.tagIndex.get(tag.toLowerCase().replace(/^#/, ''))?.delete(contactId);
      }
    }

    // Remove from trie nodes
    const terms = new Set<string>();
    for (const term of this.tokenize(contact.name)) terms.add(term);
    for (const term of this.tokenize(contact.email)) terms.add(term);
    for (const term of this.tokenize(contact.company)) terms.add(term);
    for (const term of this.tokenize(contact.role)) terms.add(term);
    for (const term of this.tokenize(contact.location)) terms.add(term);
    for (const term of this.tokenize(contact.idx)) terms.add(term);

    for (const term of terms) {
      let curr = this.root;
      curr.contactIds.delete(contactId);
      for (let i = 0; i < term.length; i++) {
        const char = term[i];
        if (!curr.children.has(char)) break;
        curr = curr.children.get(char)!;
        curr.contactIds.delete(contactId);
      }
    }
  }

  /**
   * Sub-millisecond search querying prefix trie & bitset intersections
   */
  public search(
    query: string,
    clusterFilter?: string | null
  ): { matches: string[]; executionTimeMs: number } {
    const start = performance.now();
    const cleanQuery = query.trim().toLowerCase();

    // If query is empty and no cluster filter, return all IDs
    if (!cleanQuery && !clusterFilter) {
      return {
        matches: Array.from(this.contactMap.keys()),
        executionTimeMs: performance.now() - start,
      };
    }

    let candidateIds: Set<string> | null = null;

    // Apply cluster filter if selected
    if (clusterFilter && clusterFilter !== 'ALL') {
      const clusterSet = this.clusterIndex.get(clusterFilter.toLowerCase());
      if (clusterSet) {
        candidateIds = new Set(clusterSet);
      } else {
        return { matches: [], executionTimeMs: performance.now() - start };
      }
    }

    // If there's a search query, parse it
    if (cleanQuery) {
      const tokens = cleanQuery.split(/\s+/).filter(Boolean);

      for (const token of tokens) {
        let tokenMatches: Set<string> = new Set();

        // Check if token is a tag filter (e.g., #kernel or tag:kernel)
        if (token.startsWith('#')) {
          const tag = token.slice(1);
          const tagSet = this.tagIndex.get(tag);
          if (tagSet) {
            tokenMatches = tagSet;
          }
        } else {
          // Query Trie for prefix matches
          let curr = this.root;
          let matched = true;

          for (let i = 0; i < token.length; i++) {
            const char = token[i];
            if (!curr.children.has(char)) {
              matched = false;
              break;
            }
            curr = curr.children.get(char)!;
          }

          if (matched) {
            tokenMatches = curr.contactIds;
          }
        }

        // Intersect with previous results (Bitset logic)
        if (candidateIds === null) {
          candidateIds = new Set(tokenMatches);
        } else {
          const nextCandidates = new Set<string>();
          for (const id of candidateIds) {
            if (tokenMatches.has(id)) {
              nextCandidates.add(id);
            }
          }
          candidateIds = nextCandidates;
        }

        // Fast bail if intersection is empty
        if (candidateIds.size === 0) {
          break;
        }
      }
    }

    const matches = candidateIds ? Array.from(candidateIds) : Array.from(this.contactMap.keys());
    const executionTimeMs = performance.now() - start;

    return { matches, executionTimeMs };
  }

  public getNodeCount(): number {
    return this.nodeCount;
  }

  public getContactCount(): number {
    return this.contactMap.size;
  }

  public getContact(id: string): Contact | undefined {
    return this.contactMap.get(id);
  }
}
