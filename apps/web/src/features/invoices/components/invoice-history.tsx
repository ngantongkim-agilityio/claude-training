import {
  formatChange,
  getEventLabel,
  toNewestFirst,
} from "@/features/invoices/history"
import type { InvoiceHistoryEntry } from "@/features/invoices/types"

interface InvoiceHistoryProps {
  // Taken from the detail response, so the timeline needs no request of its own
  histories: InvoiceHistoryEntry[]
}

export const InvoiceHistory = ({ histories }: InvoiceHistoryProps) => (
  <section className="space-y-3">
    <h2 id="invoice-history-heading" className="text-lg font-semibold">
      History
    </h2>
    {histories.length === 0 ? (
      <p className="text-sm text-muted-foreground">No history recorded yet.</p>
    ) : (
      <ol
        aria-labelledby="invoice-history-heading"
        className="divide-y rounded-lg border p-4"
      >
        {toNewestFirst(histories).map((entry, index) => (
          // Entries have no id; their position in the append-only, oldest-first
          // array is stable, so a new event on top doesn't re-key existing rows
          <li
            key={histories.length - 1 - index}
            className="space-y-1 py-2.5 text-sm"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span className="font-medium">{getEventLabel(entry)}</span>
              {entry.createdAt && (
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              )}
            </div>
            {entry.actor && (
              <p className="text-muted-foreground">{entry.actor}</p>
            )}
            {entry.reason && (
              <p className="break-words" style={{ overflowWrap: "anywhere" }}>
                Reason: {entry.reason}
              </p>
            )}
            {entry.comment && (
              <p className="break-words" style={{ overflowWrap: "anywhere" }}>
                Comment: {entry.comment}
              </p>
            )}
            {Object.entries(entry.changes).map(([field, change]) => (
              <p
                key={field}
                className="break-words"
                style={{ overflowWrap: "anywhere" }}
              >
                {formatChange(field, change)}
              </p>
            ))}
          </li>
        ))}
      </ol>
    )}
  </section>
)
