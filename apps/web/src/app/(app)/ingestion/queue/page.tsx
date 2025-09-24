import {
  confirmAllDraftsAction,
  confirmDraftAction,
  ignoreDraftAction,
} from "@/server/actions";
import { getDrafts } from "@/server/queries";

export default async function IngestionQueuePage() {
  const drafts = await getDrafts();
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-ink">Draft queue</h1>
          <p className="text-sm text-ink-subtle" aria-live="polite">
            {drafts.length} draft{drafts.length === 1 ? "" : "s"} ready for review.
          </p>
        </div>
        {drafts.length ? (
          <form action={confirmAllDraftsAction}>
            <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow">
              Confirm all
            </button>
          </form>
        ) : null}
      </header>

      <ul className="space-y-4">
        {drafts.map((draft) => (
          <li
            key={draft.id}
            className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">{draft.detail}</p>
                <p className="text-xs text-ink-subtle">Received {new Date(draft.receivedAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <form action={confirmDraftAction}>
                  <input type="hidden" name="id" value={draft.id} />
                  <button className="rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-white">
                    Confirm
                  </button>
                </form>
                <form action={ignoreDraftAction}>
                  <input type="hidden" name="id" value={draft.id} />
                  <button className="rounded-lg border border-border/60 px-3 py-1 text-xs font-semibold text-ink">
                    Ignore
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
        {drafts.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-border/60 bg-panel-muted p-6 text-sm text-ink-subtle">
            Queue empty. New drafts appear here from pipelines.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
