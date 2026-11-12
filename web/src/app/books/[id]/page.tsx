"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { EntryList } from "@/components/EntryList";
import { Alert, Button, Card, Input, PageShell } from "@/components/ui";
import {
  createEntry,
  deleteEntry,
  downloadExport,
  getBook,
  listEntries,
  type BookSummary,
  type LedgerEntry,
} from "@/lib/api";

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BookDetailPage() {
  const params = useParams();
  const bookId = params.id as string;

  const [bookName, setBookName] = useState("");
  const [summary, setSummary] = useState<BookSummary | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);

  const [entryType, setEntryType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [partyName, setPartyName] = useState("");
  const [category, setCategory] = useState("");
  const [remarks, setRemarks] = useState("");
  const [entryDate, setEntryDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [book, list] = await Promise.all([
        getBook(bookId),
        listEntries(bookId),
      ]);
      setBookName(book.name);
      setSummary(book.summary);
      setEntries(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!partyName.trim() || !Number.isFinite(amt) || amt <= 0) return;

    setSaving(true);
    setError(null);
    try {
      await createEntry(bookId, {
        entry_type: entryType,
        amount: amt,
        party_name: partyName.trim(),
        category: category.trim(),
        remarks: remarks.trim(),
        entry_date: entryDate,
      });
      setAmount("");
      setPartyName("");
      setCategory("");
      setRemarks("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add entry");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEntry(entryId: string) {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteEntry(entryId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete entry");
    }
  }

  async function handleExport(format: "xlsx" | "pdf") {
    setExporting(format);
    setError(null);
    try {
      const safe = bookName.replace(/[^a-zA-Z0-9-_]+/g, "_") || "cash_book";
      await downloadExport(
        bookId,
        format,
        `${safe}.${format === "xlsx" ? "xlsx" : "pdf"}`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(null);
    }
  }

  let running = 0;
  const rowsWithBalance = entries.map((row) => {
    const amt = Number(row.amount);
    if (row.entry_type === "credit") running += amt;
    else running -= amt;
    return { ...row, running };
  });

  return (
    <PageShell>
      <AppHeader title={bookName || "…"} />
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-4 sm:pt-6">
        <Link
          href="/books"
          className="inline-flex items-center text-sm font-medium text-amber-900 hover:text-amber-700"
        >
          ← All books
        </Link>

        {loading ? (
          <p className="mt-8 text-sm text-stone-500">Loading…</p>
        ) : (
          <>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="text-2xl font-bold text-stone-900">{bookName}</h1>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={exporting !== null}
                  className="w-full"
                  onClick={() => handleExport("xlsx")}
                >
                  {exporting === "xlsx" ? "…" : "Excel"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={exporting !== null}
                  className="w-full"
                  onClick={() => handleExport("pdf")}
                >
                  {exporting === "pdf" ? "…" : "PDF"}
                </Button>
              </div>
            </div>

            {summary && (
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Card className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Total credit
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700">
                    {formatMoney(summary.totalCredit)}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Total debit
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-red-700">
                    {formatMoney(summary.totalDebit)}
                  </p>
                </Card>
                <Card className="p-4 sm:col-span-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Balance
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-stone-900">
                    {formatMoney(summary.balance)}
                  </p>
                </Card>
              </div>
            )}

            <Card className="mt-6 p-4 sm:p-6">
              <h2 className="font-semibold text-stone-800">Add entry</h2>
              <form onSubmit={handleAddEntry} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEntryType("credit")}
                    className={`rounded-xl py-3 text-sm font-semibold transition-colors touch-manipulation ${
                      entryType === "credit"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "border border-stone-200 bg-stone-50 text-stone-600"
                    }`}
                  >
                    Credit
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryType("debit")}
                    className={`rounded-xl py-3 text-sm font-semibold transition-colors touch-manipulation ${
                      entryType === "debit"
                        ? "bg-red-600 text-white shadow-sm"
                        : "border border-stone-200 bg-stone-50 text-stone-600"
                    }`}
                  >
                    Debit
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount"
                    aria-label="Amount"
                  />
                  <Input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    aria-label="Entry date"
                  />
                  <Input
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    placeholder="Name"
                    required
                    aria-label="Name"
                    className="sm:col-span-2"
                  />
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Category"
                    aria-label="Category"
                  />
                  <Input
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Remarks"
                    aria-label="Remarks"
                  />
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? "Saving…" : "Add entry"}
                </Button>
              </form>
            </Card>

            {error && (
              <div className="mt-4">
                <Alert tone="error">{error}</Alert>
              </div>
            )}

            <Card className="mt-8 overflow-hidden">
              <div className="border-b border-stone-100 px-4 py-3 sm:px-5">
                <h2 className="font-semibold text-stone-800">Ledger</h2>
              </div>
              <EntryList rows={rowsWithBalance} onDelete={handleDeleteEntry} />
            </Card>
          </>
        )}
      </main>
    </PageShell>
  );
}
