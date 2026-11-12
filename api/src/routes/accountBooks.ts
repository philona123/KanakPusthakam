import { Router, type Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { createUserClient } from "../lib/supabase.js";
import {
  createAccountBookSchema,
  updateAccountBookSchema,
  type LedgerEntryRow,
} from "../schemas.js";
import { computeSummary } from "../lib/ledger.js";

export const accountBooksRouter = Router();

accountBooksRouter.get("/", async (req: AuthRequest, res: Response) => {
  const supabase = createUserClient(req.accessToken!);
  const { data, error } = await supabase
    .from("account_books")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

accountBooksRouter.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = createAccountBookSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const supabase = createUserClient(req.accessToken!);
  const { data, error } = await supabase
    .from("account_books")
    .insert({
      user_id: req.user!.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json(data);
});

accountBooksRouter.get("/:bookId", async (req: AuthRequest, res: Response) => {
  const supabase = createUserClient(req.accessToken!);
  const { data: book, error: bookError } = await supabase
    .from("account_books")
    .select("*")
    .eq("id", req.params.bookId)
    .maybeSingle();

  if (bookError) {
    res.status(500).json({ error: bookError.message });
    return;
  }
  if (!book) {
    res.status(404).json({ error: "Account book not found" });
    return;
  }

  const { data: entries, error: entriesError } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("account_book_id", req.params.bookId);

  if (entriesError) {
    res.status(500).json({ error: entriesError.message });
    return;
  }

  const summary = computeSummary((entries ?? []) as LedgerEntryRow[]);
  res.json({ ...book, summary });
});

accountBooksRouter.patch("/:bookId", async (req: AuthRequest, res: Response) => {
  const parsed = updateAccountBookSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  if (!parsed.data.name && parsed.data.description === undefined) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const supabase = createUserClient(req.accessToken!);
  const { data, error } = await supabase
    .from("account_books")
    .update(parsed.data)
    .eq("id", req.params.bookId)
    .select()
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: "Account book not found" });
    return;
  }
  res.json(data);
});

accountBooksRouter.delete("/:bookId", async (req: AuthRequest, res: Response) => {
  const supabase = createUserClient(req.accessToken!);
  const { error, count } = await supabase
    .from("account_books")
    .delete({ count: "exact" })
    .eq("id", req.params.bookId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (count === 0) {
    res.status(404).json({ error: "Account book not found" });
    return;
  }
  res.status(204).send();
});
