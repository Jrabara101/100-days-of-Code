"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTaskRemote, fetchTasks, getTasksEndpoint } from "@/lib/api";
import {
  Task,
  deletePendingTask,
  getAllTasks,
  getPendingTasks,
  putTask,
  putTasks,
  queueTask
} from "@/lib/db";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { registerTaskSync } from "@/lib/sync";

const TASKS_KEY = ["tasks"];

const mergeRemoteWithPending = (remote: Task[], local: Task[]) => {
  const pending = local.filter((task) => task.pending);
  const remoteIds = new Set(remote.map((task) => task.id));
  const merged = [...remote];

  for (const pendingTask of pending) {
    if (!remoteIds.has(pendingTask.id)) {
      merged.unshift(pendingTask);
    }
  }

  return merged;
};

const createClientId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function useTasks() {
  const online = useOnlineStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    getAllTasks().then((tasks) => {
      if (tasks.length) {
        queryClient.setQueryData(TASKS_KEY, tasks);
      }
    });
  }, [queryClient]);

  useEffect(() => {
    if (online) {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    } else {
      getAllTasks().then((tasks) => {
        if (tasks.length) {
          queryClient.setQueryData(TASKS_KEY, tasks);
        }
      });
    }
  }, [online, queryClient]);

  const tasksQuery = useQuery({
    queryKey: TASKS_KEY,
    queryFn: async () => {
      const remote = await fetchTasks();
      const local = await getAllTasks();
      const merged = mergeRemoteWithPending(remote, local);
      await putTasks(merged);
      return merged;
    },
    enabled: online,
    initialData: [] as Task[]
  });

  const createTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) throw new Error("Task title is required");

      const clientId = createClientId();
      const localId = `local-${clientId}`;
      const now = new Date().toISOString();

      if (!online) {
        const localTask: Task = {
          id: localId,
          title: trimmed,
          status: "open",
          updatedAt: now,
          clientId,
          pending: true
        };
        await putTask(localTask);
        await queueTask({
          id: clientId,
          localId,
          title: trimmed,
          createdAt: now,
          endpoint: getTasksEndpoint()
        });
        await registerTaskSync();
        return localTask;
      }

      try {
        const remoteTask = await createTaskRemote(trimmed, clientId);
        await putTask(remoteTask);
        return remoteTask;
      } catch {
        const localTask: Task = {
          id: localId,
          title: trimmed,
          status: "open",
          updatedAt: now,
          clientId,
          pending: true
        };
        await putTask(localTask);
        await queueTask({
          id: clientId,
          localId,
          title: trimmed,
          createdAt: now,
          endpoint: getTasksEndpoint()
        });
        await registerTaskSync();
        return localTask;
      }
    },
    onSuccess: async (task) => {
      queryClient.setQueryData(TASKS_KEY, (current: Task[] | undefined) => {
        const list = current ? [...current] : [];
        const existingIndex = list.findIndex((item) => item.id === task.id);
        if (existingIndex >= 0) {
          list[existingIndex] = task;
        } else {
          list.unshift(task);
        }
        return list;
      });

      if (!task.pending && task.clientId) {
        const pending = await getPendingTasks();
        const queued = pending.find((item) => item.id === task.clientId);
        if (queued) {
          await deletePendingTask(queued.id);
        }
      }
    }
  });

  const tasks = (tasksQuery.data ?? []).slice().sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const pendingCount = useMemo(
    () => tasks.filter((task) => task.pending).length,
    [tasks]
  );

  return {
    tasks,
    isLoading: tasksQuery.isLoading,
    isFetching: tasksQuery.isFetching,
    isOnline: online,
    pendingCount,
    createTask: createTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending
  };
}
