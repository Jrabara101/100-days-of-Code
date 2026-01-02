import Dexie, { type Table } from 'dexie';

export interface Bookmark {
    id?: number;
    url: string;
    title: string;
    description?: string;
    image?: string;
    content?: string; // For full-text search
    favicon?: string;
    createdAt: number;
    tags: string[];
    lastVisited?: number;
}

export class SynapseDB extends Dexie {
    bookmarks!: Table<Bookmark, number>;

    constructor() {
        super('synapse-db');
        this.version(1).stores({
            bookmarks: '++id, url, title, *tags, createdAt'
        });
    }
}

export const db = new SynapseDB();
