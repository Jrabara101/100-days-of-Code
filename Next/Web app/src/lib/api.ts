import type { Task } from "@/lib/db";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export const getApiBaseUrl = () => {
  if (typeof window === "undefined") return API_BASE_URL;
  const resolved = new URL(API_BASE_URL, window.location.origin).toString();
  return resolved.replace(/\/$/, "");
};

export const getTasksEndpoint = () => `${getApiBaseUrl()}/tasks`;

const normalizeTask = (data: Record<string, unknown>, clientId?: string): Task => {
  const id = String(data.id ?? data.uuid ?? data.clientId ?? clientId ?? `local-${Date.now()}`);
  return {
    id,
    title: String(data.title ?? data.name ?? "Untitled task"),
    status: (data.status as Task["status"]) ?? "open",
    updatedAt: String(data.updatedAt ?? data.updated_at ?? new Date().toISOString()),
    clientId: clientId ?? (data.clientId as string | undefined),
    pending: false
  };
};

export async function fetchTasks(): Promise<Task[]> {
  const response = await fetch(getTasksEndpoint(), {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }

  const payload = (await response.json()) as
    | Task[]
    | { data?: Task[]; tasks?: Task[] }
    | Record<string, unknown>;

  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: Task[] }).data)
      ? (payload as { data: Task[] }).data
      : Array.isArray((payload as { tasks?: Task[] }).tasks)
        ? (payload as { tasks: Task[] }).tasks
        : [];

  return list.map((task) => normalizeTask(task as Record<string, unknown>));
}

export async function createTaskRemote(title: string, clientId: string): Promise<Task> {
  const response = await fetch(getTasksEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ title, clientId })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to create task");
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const taskData = (payload as { data?: Record<string, unknown> }).data ?? payload;

  return normalizeTask(taskData, clientId);
}