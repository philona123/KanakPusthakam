import { Router, type Response } from "express";
import ExcelJS from "exceljs";
import type { AuthRequest } from "../middleware/auth.js";
import { createUserClient } from "../lib/supabase.js";
import type { AccountBookRow, LedgerEntryRow } from "../schemas.js";
import { computeSummary, withRunningBalance } from "../lib/ledger.js";
import { renderCashBookPdf } from "../lib/pdfCashBook.js";

export const exportRouter = Router({ mergeParams: true });

async function loadBookAndEntries(
  accessToken: string,
  bookId: string
): Promise<
  | { ok: true; book: AccountBookRow; entries: LedgerEntryRow[] }
  | { ok: false; status: number; message: string }
> {
  const supabase = createUserClient(accessToken);

  const { data: book, error: bookError } = await supabase
    .from("account_books")
    .select("*")
    .eq("id", bookId)
    .maybeSingle();

  if (bookError) {
    return { ok: false, status: 500, message: bookError.message };
  }
  if (!book) {
    return { ok: false, status: 404, message: "Account book not found" };
  }

  const { data: entries, error: entriesError } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("account_book_id", bookId)
    .order("entry_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (entriesError) {
    return { ok: false, status: 500, message: entriesError.message };
  }

  return {
    ok: true,
    book: book as AccountBookRow,
    entries: (entries ?? []) as LedgerEntryRow[],
  };
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 80);
}

exportRouter.get("/export.xlsx", async (req: AuthRequest, res: Response) => {
  const bookId = String(req.params.bookId);
  const loaded = await loadBookAndEntries(req.accessToken!, bookId);
  if (!loaded.ok) {
    res.status(loaded.status).json({ error: loaded.message });
    return;
  }

  const { book, entries } = loaded;
  const rows = withRunningBalance(entries);
  const summary = computeSummary(entries);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Cash Book");

  sheet.mergeCells("A1:G1");
  sheet.getCell("A1").value = book.name;
  sheet.getCell("A1").font = { bold: true, size: 14 };

  if (book.description) {
    sheet.mergeCells("A2:G2");
    sheet.getCell("A2").value = book.description;
  }

  sheet.getCell("A4").value = `Total Credit: ${summary.totalCredit.toFixed(2)}`;
  sheet.getCell("A5").value = `Total Debit: ${summary.totalDebit.toFixed(2)}`;
  sheet.getCell("A6").value = `Balance: ${summary.balance.toFixed(2)}`;

  const headerRow = 8;
  const headers = [
    "Date",
    "Type",
    "Name",
    "Category",
    "Remarks",
    "Amount",
    "Running Balance",
  ];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(headerRow, i + 1);
    cell.value = h;
    cell.font = { bold: true };
  });

  rows.forEach((row, idx) => {
    const r = headerRow + 1 + idx;
    sheet.getCell(r, 1).value = row.entry_date;
    sheet.getCell(r, 2).value = row.entry_type;
    sheet.getCell(r, 3).value = row.party_name;
    sheet.getCell(r, 4).value = row.category;
    sheet.getCell(r, 5).value = row.remarks;
    sheet.getCell(r, 6).value = Number(row.amount);
    sheet.getCell(r, 7).value = row.running_balance;
  });

  sheet.columns = [
    { width: 12 },
    { width: 10 },
    { width: 22 },
    { width: 16 },
    { width: 28 },
    { width: 12 },
    { width: 16 },
  ];

  const filename = `${safeFilename(book.name)}_cash_book.xlsx`;
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
});

exportRouter.get("/export.pdf", async (req: AuthRequest, res: Response) => {
  const bookId = String(req.params.bookId);
  const loaded = await loadBookAndEntries(req.accessToken!, bookId);
  if (!loaded.ok) {
    res.status(loaded.status).json({ error: loaded.message });
    return;
  }

  const { book, entries } = loaded;

  const filename = `${safeFilename(book.name)}_cash_book.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = renderCashBookPdf(book, entries);
  doc.pipe(res);
  doc.end();
});
