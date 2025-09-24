export function isSyncPaused() {
  return process.env.NEXT_PUBLIC_SYNC_PAUSED === "1";
}
