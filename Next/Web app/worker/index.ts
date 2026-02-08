/// <reference lib="webworker" />

import { openDB } from "idb";

type PendingTask = {
  id: string;
  localId: string;
  title: string;
  createdAt: string;
  endpoint: string;
};

type Task = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  clientId?: string;
  pending?: boolean;
};

const DB_NAME = "fieldsync";
const DB_VERSION = 1;

const getDb = () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("tasks")) {
        db.createObjectStore("tasks", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("outbox")) {
        db.createObjectStore("outbox", { keyPath: "id" });
      }
    }
  });

self.addEventListener("sync", (event) => {
  if (event.tag === "fieldsync-sync") {
    event.waitUntil(syncOutbox());
  }
});

async function syncOutbox() {
  const db = await getDb();
  const outbox = await db.getAll("outbox");

  for (const item of outbox as PendingTask[]) {
    try {
      const response = await fetch(item.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          title: item.title,
          clientId: item.id
        })
      });

      if (!response.ok) {
        throw new Error("Sync failed");
      }

      const payload = (await response.json().catch(() => null)) as
        | Record<string, unknown>
        | null;
      const taskData = (payload as { data?: Record<string, unknown> } | null)?.data ?? payload;

      const localTask = (await db.get("tasks", item.localId)) as Task | undefined;

      if (localTask) {
        if (taskData) {
          const resolvedId = String(
            (taskData as Record<string, unknown>).id ??
              (taskData as Record<string, unknown>).uuid ??
              item.id
          );
          const updatedTask: Task = {
            ...localTask,
            id: resolvedId,
            title: String((taskData as Record<string, unknown>).title ?? localTask.title),
            status: String((taskData as Record<string, unknown>).status ?? localTask.status),
            updatedAt: String(
              (taskData as Record<string, unknown>).updatedAt ??
                (taskData as Record<string, unknown>).updated_at ??
                new Date().toISOString()
            ),
            pending: false,
            clientId: item.id
          };

          if (resolvedId !== item.localId) {
            await db.delete("tasks", item.localId);
          }
          await db.put("tasks", updatedTask);
        } else {
          await db.put("tasks", { ...localTask, pending: false });
        }
      }

      await db.delete("outbox", item.id);
    } catch {
      // Keep item in outbox for the next sync attempt.
    }
  }
}