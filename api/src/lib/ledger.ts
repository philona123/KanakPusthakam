import type { LedgerEntryRow } from "../schemas.js";

export function computeSummary(entries: LedgerEntryRow[]) {
  let totalCredit = 0;
  let totalDebit = 0;
  for (const e of entries) {
    const amt = Number(e.amount);
    if (e.entry_type === "credit") totalCredit += amt;
    else totalDebit += amt;
  }
  return {
    totalCredit,
    totalDebit,
    balance: totalCredit - totalDebit,
  };
}

export function withRunningBalance(entries: LedgerEntryRow[]) {
  let running = 0;
  return entries.map((e) => {
    const amt = Number(e.amount);
    if (e.entry_type === "credit") running += amt;
    else running -= amt;
    return { ...e, running_balance: running };
  });
}
