import Link from "next/link";
import { getPipelines, getDrafts } from "@/server/queries";

export default async function IngestionPage() {
  const [pipelines, drafts] = await Promise.all([getPipelines(), getDrafts()]);
  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-ink">Ingestion pipelines</h1>
        <p className="text-ink-subtle max-w-2xl">
          Email, upload, and webhook sources feed into the draft queue. Confirm drafts to transform them into transactions and auto-sync USD budgets.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {pipelines.map((pipeline) => (
          <div
            key={pipeline.id}
            className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm"
          >
            <p className="text-sm font-semibold text-ink">{pipeline.name}</p>
            <p className="text-xs text-ink-subtle">{pipeline.description}</p>
            <span
              className={`mt-3 inline-flex items-center gap-2 text-xs font-medium ${pipeline.status === "Operational" ? "text-positive bg-positive/10" : "text-negative bg-negative/10"} px-2 py-1 rounded-full`}
            >
              <span className={`h-2 w-2 rounded-full ${pipeline.status === "Operational" ? "bg-positive" : "bg-negative"}`} />
              {pipeline.status}
            </span>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Draft queue</h2>
            <p className="text-sm text-ink-subtle">
              {drafts.length} draft{drafts.length === 1 ? "" : "s"} waiting for review.
            </p>
          </div>
          <Link
            href="/ingestion/queue"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow"
          >
            Review queue
          </Link>
        </div>
      </section>
    </div>
  );
}
