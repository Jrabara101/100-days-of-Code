export async function registerTaskSync() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (!("SyncManager" in window)) return;

  const registration = await navigator.serviceWorker.ready;
  try {
    await registration.sync.register("fieldsync-sync");
  } catch {
    // Ignore - browser may deny, app will retry on next online event.
  }
}