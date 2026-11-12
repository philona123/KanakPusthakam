"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Alert, Button, Card, Input, PageShell } from "@/components/ui";
import {
  createBook,
  deleteBook,
  listBooks,
  type AccountBook,
} from "@/lib/api";

export default function BooksPage() {
  const [books, setBooks] = useState<AccountBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listBooks();
      setBooks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load books");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createBook(name.trim(), description.trim() || undefined);
      setName("");
      setDescription("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create book");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, bookName: string) {
    if (!confirm(`Delete account book "${bookName}" and all its entries?`)) {
      return;
    }
    try {
      await deleteBook(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  return (
    <PageShell>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:pt-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Account books</h1>
          <p className="mt-1 text-sm text-stone-600">
            Create and manage your cash books in one place.
          </p>
        </div>

        <Card className="p-4 sm:p-6">
          <h2 className="font-semibold text-stone-800">New account book</h2>
          <form onSubmit={handleCreate} className="mt-4 space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Book name"
              required
              aria-label="Book name"
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              aria-label="Description"
            />
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? "Creating…" : "Create book"}
            </Button>
          </form>
        </Card>

        {error && (
          <div className="mt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Your books
          </h2>
          {loading ? (
            <p className="text-sm text-stone-500">Loading…</p>
          ) : books.length === 0 ? (
            <Card className="p-8 text-center text-sm text-stone-500">
              No books yet. Create one above to get started.
            </Card>
          ) : (
            <ul className="space-y-3">
              {books.map((book) => (
                <li key={book.id}>
                  <Card className="flex items-center justify-between gap-3 p-4 sm:p-5">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/books/${book.id}`}
                        className="block font-semibold text-amber-950 hover:text-amber-800"
                      >
                        {book.name}
                      </Link>
                      {book.description && (
                        <p className="mt-0.5 text-sm text-stone-500 line-clamp-2">
                          {book.description}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      className="shrink-0 !py-2 !px-3 text-xs"
                      onClick={() => handleDelete(book.id, book.name)}
                    >
                      Delete
                    </Button>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </PageShell>
  );
}
