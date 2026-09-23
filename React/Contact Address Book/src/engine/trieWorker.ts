// Web Worker for off-main-thread indexing when datasets exceed 5,000 contacts
import { ContactTrieIndex } from './trieIndex';
import { Contact } from '../types/contact';

let workerIndex = new ContactTrieIndex();

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'BUILD_INDEX': {
      const contacts: Contact[] = payload.contacts;
      const buildDuration = workerIndex.build(contacts);
      self.postMessage({
        type: 'INDEX_BUILT',
        payload: {
          buildDuration,
          nodeCount: workerIndex.getNodeCount(),
          contactCount: workerIndex.getContactCount(),
        },
      });
      break;
    }

    case 'SEARCH': {
      const { query, clusterFilter } = payload;
      const { matches, executionTimeMs } = workerIndex.search(query, clusterFilter);
      self.postMessage({
        type: 'SEARCH_RESULTS',
        payload: { matches, executionTimeMs, query },
      });
      break;
    }

    case 'INSERT': {
      workerIndex.insert(payload.contact);
      break;
    }

    case 'REMOVE': {
      workerIndex.remove(payload.contactId);
      break;
    }
  }
};
