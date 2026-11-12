import PDFDocument from "pdfkit";
import type { AccountBookRow, LedgerEntryRow } from "../schemas.js";
import { computeSummary, withRunningBalance } from "./ledger.js";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

const COLORS = {
  brand: "#92400e",
  brandLight: "#fef3c7",
  headerBg: "#78350f",
  text: "#1c1917",
  muted: "#78716c",
  border: "#e7e5e4",
  credit: "#166534",
  debit: "#b91c1c",
  rowAlt: "#fafaf9",
};

type RowWithBalance = LedgerEntryRow & { running_balance: number };

const COLUMNS = [
  { key: "date", label: "Date", width: 62, align: "left" as const },
  { key: "particulars", label: "Particulars", width: 210, align: "left" as const },
  { key: "credit", label: "Credit", width: 70, align: "right" as const },
  { key: "debit", label: "Debit", width: 70, align: "right" as const },
  { key: "balance", label: "Balance", width: 87, align: "right" as const },
];

function formatAmount(n: number): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function particularsText(row: RowWithBalance): string {
  const lines = [row.party_name];
  if (row.category?.trim()) lines.push(`Category: ${row.category.trim()}`);
  if (row.remarks?.trim()) lines.push(row.remarks.trim());
  return lines.join("\n");
}

function columnX(index: number): number {
  let x = MARGIN;
  for (let i = 0; i < index; i++) x += COLUMNS[i].width;
  return x;
}

export function renderCashBookPdf(
  book: AccountBookRow,
  entries: LedgerEntryRow[]
): InstanceType<typeof PDFDocument> {
  const summary = computeSummary(entries);
  const rows = withRunningBalance(entries);
  const generatedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const doc = new PDFDocument({
    size: "A4",
    margin: MARGIN,
    bufferPages: true,
  });

  let y = MARGIN;

  function ensureSpace(needed: number): void {
    if (y + needed > PAGE.height - MARGIN - 28) {
      doc.addPage();
      y = MARGIN;
      drawContinuationHeader();
      drawTableHeader();
    }
  }

  function drawContinuationHeader(): void {
    doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.text);
    doc.text(book.name, MARGIN, y);
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted);
    doc.text("(continued)", MARGIN + doc.widthOfString(book.name) + 6, y + 2);
    y += 22;
  }

  function drawPageHeader(): void {
    doc.save();
    doc.rect(MARGIN, y, CONTENT_WIDTH, 56).fill(COLORS.headerBg);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20);
    doc.text(book.name, MARGIN + 16, y + 14, { width: CONTENT_WIDTH - 32 });
    doc.font("Helvetica").fontSize(9);
    doc.text("Cash Book Ledger", MARGIN + 16, y + 38);
    doc.fillColor(COLORS.muted);
    doc.text(generatedAt, MARGIN, y + 38, {
      width: CONTENT_WIDTH - 16,
      align: "right",
    });
    doc.restore();
    y += 64;

    if (book.description) {
      doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted);
      doc.text(book.description, MARGIN, y, { width: CONTENT_WIDTH });
      y += doc.heightOfString(book.description, { width: CONTENT_WIDTH }) + 8;
    }

    const boxW = (CONTENT_WIDTH - 16) / 3;
    const boxH = 44;
    const labels = [
      { label: "Total credit", value: formatAmount(summary.totalCredit), color: COLORS.credit },
      { label: "Total debit", value: formatAmount(summary.totalDebit), color: COLORS.debit },
      { label: "Closing balance", value: formatAmount(summary.balance), color: COLORS.text },
    ];
    labels.forEach((item, i) => {
      const x = MARGIN + i * (boxW + 8);
      doc.roundedRect(x, y, boxW, boxH, 6).fillAndStroke(COLORS.brandLight, COLORS.border);
      doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted);
      doc.text(item.label, x + 10, y + 8, { width: boxW - 20 });
      doc.font("Helvetica-Bold").fontSize(11).fillColor(item.color);
      doc.text(item.value, x + 10, y + 22, { width: boxW - 20 });
    });
    y += boxH + 16;
  }

  function drawTableHeader(): void {
    const headerH = 22;
    doc.save();
    doc.rect(MARGIN, y, CONTENT_WIDTH, headerH).fill(COLORS.brand);
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff");
    COLUMNS.forEach((col, i) => {
      const x = columnX(i) + 6;
      const w = col.width - 12;
      doc.text(col.label, x, y + 7, { width: w, align: col.align });
    });
    doc.restore();
    y += headerH;
  }

  function drawRow(row: RowWithBalance, index: number): void {
    const particulars = particularsText(row);
    const credit =
      row.entry_type === "credit" ? formatAmount(Number(row.amount)) : "—";
    const debit =
      row.entry_type === "debit" ? formatAmount(Number(row.amount)) : "—";
    const balance = formatAmount(row.running_balance);

    doc.font("Helvetica").fontSize(8);
    const particularsHeight = doc.heightOfString(particulars, {
      width: COLUMNS[1].width - 12,
    });
    const rowH = Math.max(28, particularsHeight + 14);

    ensureSpace(rowH + 4);

    if (index % 2 === 1) {
      doc.save();
      doc.rect(MARGIN, y, CONTENT_WIDTH, rowH).fill(COLORS.rowAlt);
      doc.restore();
    }

    doc.save();
    doc.moveTo(MARGIN, y + rowH).lineTo(MARGIN + CONTENT_WIDTH, y + rowH).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    doc.restore();

    const textY = y + 8;
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.text);
    doc.text(formatDate(row.entry_date), columnX(0) + 6, textY, {
      width: COLUMNS[0].width - 12,
    });
    doc.text(particulars, columnX(1) + 6, textY, {
      width: COLUMNS[1].width - 12,
      lineGap: 2,
    });
    doc.fillColor(row.entry_type === "credit" ? COLORS.credit : COLORS.muted);
    doc.text(credit, columnX(2) + 6, textY, {
      width: COLUMNS[2].width - 12,
      align: "right",
    });
    doc.fillColor(row.entry_type === "debit" ? COLORS.debit : COLORS.muted);
    doc.text(debit, columnX(3) + 6, textY, {
      width: COLUMNS[3].width - 12,
      align: "right",
    });
    doc.fillColor(COLORS.text);
    doc.font("Helvetica-Bold")
      .text(balance, columnX(4) + 6, textY, {
        width: COLUMNS[4].width - 12,
        align: "right",
      });
    doc.font("Helvetica");

    y += rowH;
  }

  drawPageHeader();
  drawTableHeader();

  if (rows.length === 0) {
    ensureSpace(40);
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.muted);
    doc.text("No entries recorded in this book.", MARGIN, y + 12, {
      width: CONTENT_WIDTH,
      align: "center",
    });
  } else {
    rows.forEach((row, i) => drawRow(row, i));
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted);
    doc.text(
      `Kanak Pusthakam · Page ${i + 1} of ${range.count}`,
      MARGIN,
      PAGE.height - MARGIN + 8,
      { width: CONTENT_WIDTH, align: "center" }
    );
  }

  return doc;
}
