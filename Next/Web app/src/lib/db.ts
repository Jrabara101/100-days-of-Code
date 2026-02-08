import { DBSchema, IDBPDatabase, openDB } from "idb";

export type TaskStatus = "open" | "done";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  updatedAt: string;
  clientId?: string;
  pending?: boolean;
}

export interface PendingTask {
  id: string;
  localId: string;
  title: string;
  createdAt: string;
  endpoint: string;
}

interface FieldSyncDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
  };
  outbox: {
    key: string;
    value: PendingTask;
  };
}

const DB_NAME = "fieldsync";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FieldSyncDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<FieldSyncDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("tasks")) {
          db.createObjectStore("tasks", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("outbox")) {
          db.createObjectStore("outbox", { keyPath: "id" });
        }
      }
    });
  }
  return dbPromise;
}

export async function getAllTasks() {
  const db = await getDb();
  return db.getAll("tasks");
}

export async function putTasks(tasks: Task[]) {
  const db = await getDb();
  const tx = db.transaction("tasks", "readwrite");
  for (const task of tasks) {
    await tx.store.put(task);
  }
  await tx.done;
}

export async function putTask(task: Task) {
  const db = await getDb();
  await db.put("tasks", task);
}

export async function queueTask(task: PendingTask) {
  const db = await getDb();
  await db.put("outbox", task);
}

export async function getPendingTasks() {
  const db = await getDb();
  return db.getAll("outbox");
}

export async function deletePendingTask(id: string) {
  const db = await getDb();
  await db.delete("outbox", id);
}