import InstallPrompt from "@/components/InstallPrompt";
import OfflineBadge from "@/components/OfflineBadge";
import TaskBoard from "@/components/TaskBoard";

export default function Home() {
  return (
    <main className="app-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              FieldSync Offline Pro
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Enterprise field work without a signal.
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 md:text-base">
              Plan, capture, and sync critical tasks from anywhere. Your changes are queued locally
              and pushed back the moment the network returns.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <OfflineBadge />
            <InstallPrompt />
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="card-surface rounded-3xl p-6 md:p-8">
            <h2 className="text-lg font-semibold text-slate-900">Offline command center</h2>
            <p className="mt-3 text-sm text-slate-600">
              FieldSync uses a dedicated service worker, IndexedDB persistence, and background sync
              to keep tasks flowing. You can close the app, move out of range, and trust the queue.
            </p>
            <div className="mt-6 grid gap-4 text-xs text-slate-600 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <p className="font-semibold text-slate-900">Stale-while-revalidate</p>
                <p className="mt-2">
                  Tasks load instantly from cache, then refresh silently in the background.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <p className="font-semibold text-slate-900">Background Sync</p>
                <p className="mt-2">
                  Offline changes are stored in IndexedDB and replayed as soon as connectivity is back.
                </p>
              </div>
            </div>
          </div>

          <div className="card-surface rounded-3xl p-6 md:p-8">
            <h2 className="text-lg font-semibold text-slate-900">Status overview</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Local cache</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sync pipeline</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Auto-retry
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Storage</span>
                <span className="text-xs font-semibold text-slate-800">IndexedDB</span>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-xs text-slate-500">
              Set <code className="font-mono">NEXT_PUBLIC_API_BASE_URL</code> to point at your Laravel
              backend (default: <span className="font-mono">/api</span>).
            </div>
          </div>
        </section>

        <TaskBoard />
      </div>
    </main>
  );
}