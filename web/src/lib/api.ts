import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type AccountBook = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type BookSummary = {
  totalCredit: number;
  totalDebit: number;
  balance: number;
};

export type LedgerEntry = {
  id: string;
  account_book_id: string;
  entry_type: "credit" | "debit";
  amount: number;
  party_name: string;
  category: string;
  remarks: string;
  entry_date: string;
  created_at: string;
};

async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Not authenticated");
  }
  return data.session.access_token;
}

async function apiFetch(path: string, init?: RequestInit) {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });

  if (res.status === 204) return null;

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof body.error === "string"
        ? body.error
        : res.statusText || "Request failed";
    throw new Error(msg);
  }
  return body;
}

export async function listBooks(): Promise<AccountBook[]> {
  return apiFetch("/account-books");
}

export async function createBook(name: string, description?: string) {
  return apiFetch("/account-books", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

export async function getBook(
  id: string
): Promise<AccountBook & { summary: BookSummary }> {
  return apiFetch(`/account-books/${id}`);
}

export async function deleteBook(id: string) {
  return apiFetch(`/account-books/${id}`, { method: "DELETE" });
}

export async function listEntries(bookId: string): Promise<LedgerEntry[]> {
  return apiFetch(`/account-books/${bookId}/entries`);
}

export async function createEntry(
  bookId: string,
  entry: {
    entry_type: "credit" | "debit";
    amount: number;
    party_name: string;
    category?: string;
    remarks?: string;
    entry_date?: string;
  }
) {
  return apiFetch(`/account-books/${bookId}/entries`, {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

export async function updateEntry(
  entryId: string,
  patch: Partial<{
    entry_type: "credit" | "debit";
    amount: number;
    party_name: string;
    category: string;
    remarks: string;
    entry_date: string;
  }>
) {
  return apiFetch(`/entries/${entryId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteEntry(entryId: string) {
  return apiFetch(`/entries/${entryId}`, { method: "DELETE" });
}

export async function downloadExport(
  bookId: string,
  format: "xlsx" | "pdf",
  filename: string
) {
  const token = await getAccessToken();
  const ext = format === "xlsx" ? "xlsx" : "pdf";
  const res = await fetch(`${API_URL}/account-books/${bookId}/export.${ext}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body.error === "string" ? body.error : "Export failed"
    );
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
