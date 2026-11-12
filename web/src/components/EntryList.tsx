"use client";

import { Button } from "@/components/ui";
import type { LedgerEntry } from "@/lib/api";

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export type EntryWithBalance = LedgerEntry & { running: number };

export function EntryList({
  rows,
  onDelete,
}: {
  rows: EntryWithBalance[];
  onDelete: (id: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-stone-500">
        No entries yet. Add your first credit or debit above.
      </p>
    );
  }

  return (
    <>
      <DesktopEntryTable rows={rows} onDelete={onDelete} />
      <MobileEntryCards rows={rows} onDelete={onDelete} />
    </>
  );
}

function MobileEntryCards({
  rows,
  onDelete,
}: {
  rows: EntryWithBalance[];
  onDelete: (id: string) => void;
}) {
  return (
    <ul className="md:hidden divide-y divide-stone-100">
      {rows.map((row) => (
        <li key={row.id} className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-stone-900">{row.party_name}</p>
              <p className="text-xs text-stone-500 mt-0.5">{row.entry_date}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                row.entry_type === "credit"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {row.entry_type}
            </span>
          </div>
          {(row.category || row.remarks) && (
            <p className="text-sm text-stone-600 line-clamp-2">
              {[row.category, row.remarks].filter(Boolean).join(" · ")}
            </p>
          )}
          <div className="flex items-end justify-between gap-2 pt-1">
            <div>
              <p className="text-xs text-stone-500">Amount</p>
              <p className="font-mono text-lg font-semibold text-stone-900">
                {formatMoney(Number(row.amount))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500">Balance</p>
              <p className="font-mono text-sm font-medium text-stone-800">
                {formatMoney(row.running)}
              </p>
            </div>
            <Button
              type="button"
              variant="danger"
              className="!py-2 !px-3 text-xs"
              onClick={() => onDelete(row.id)}
            >
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function DesktopEntryTable({
  rows,
  onDelete,
}: {
  rows: EntryWithBalance[];
  onDelete: (id: string) => void;
}) {
  return (
    <table className="hidden md:table w-full text-sm">
      <thead>
        <tr className="border-b border-stone-200 bg-stone-50/80 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
          <th className="p-3">Date</th>
          <th className="p-3">Type</th>
          <th className="p-3">Name</th>
          <th className="p-3">Category</th>
          <th className="p-3">Remarks</th>
          <th className="p-3 text-right">Amount</th>
          <th className="p-3 text-right">Balance</th>
          <th className="p-3 w-16" />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.id}
            className="border-b border-stone-100 last:border-0 hover:bg-amber-50/30"
          >
            <td className="p-3 whitespace-nowrap text-stone-700">{row.entry_date}</td>
            <td className="p-3 capitalize">
              <span
                className={
                  row.entry_type === "credit"
                    ? "text-emerald-700"
                    : "text-red-700"
                }
              >
                {row.entry_type}
              </span>
            </td>
            <td className="p-3 font-medium text-stone-900">{row.party_name}</td>
            <td className="p-3 text-stone-600">{row.category || "—"}</td>
            <td className="p-3 max-w-[12rem] truncate text-stone-600">
              {row.remarks || "—"}
            </td>
            <td className="p-3 text-right font-mono tabular-nums">
              {formatMoney(Number(row.amount))}
            </td>
            <td className="p-3 text-right font-mono tabular-nums font-medium">
              {formatMoney(row.running)}
            </td>
            <td className="p-3">
              <Button
                type="button"
                variant="ghost"
                className="!py-1.5 !px-2 text-xs text-red-600"
                onClick={() => onDelete(row.id)}
              >
                Delete
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
