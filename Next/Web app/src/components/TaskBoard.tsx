"use client";

import { type FormEvent, useState } from "react";
import { useTasks } from "@/hooks/useTasks";

export default function TaskBoard() {
  const [title, setTitle] = useState("");
  const { tasks, createTask, isCreating, isFetching, isOnline, pendingCount } = useTasks();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      await createTask(title);
      setTitle("");
    } catch {
      // UI stays responsive even if the request fails.
    }
  };

  return (
    <section className="grid gap-6">
      <div className="card-surface rounded-3xl p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Create a task</h2>
            <p className="mt-1 text-xs text-slate-500">
              {isOnline
                ? "Changes sync instantly."
                : "You are offline. New tasks will be queued for sync."}
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {pendingCount} queued
            </span>
          )}
        </div>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 md:flex-row">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Log equipment inspection, safety check, or site update"
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Queueing..." : "Add task"}
          </button>
        </form>
      </div>

      <div className="card-surface rounded-3xl p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Task list</h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {isFetching ? "Refreshing" : "Up to date"}
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            {tasks.length} total
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-500">
              No tasks yet. Capture your first field update above.
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Updated {new Date(task.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {task.status}
                  </span>
                  {task.pending && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Pending sync
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
