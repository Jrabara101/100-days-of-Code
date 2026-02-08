export default function OfflineFallback() {
  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-6">
      <div className="card-surface max-w-md rounded-3xl p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">You are offline</h1>
        <p className="mt-3 text-sm text-slate-600">
          Cached data is still available. New tasks will queue automatically until the network is back.
        </p>
      </div>
    </main>
  );
}