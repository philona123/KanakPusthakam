import { Router, type Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { createUserClient } from "../lib/supabase.js";
import { createEntrySchema, updateEntrySchema } from "../schemas.js";

export const entriesRouter = Router({ mergeParams: true });

entriesRouter.get("/", async (req: AuthRequest, res: Response) => {
  const bookId = req.params.bookId;
  const supabase = createUserClient(req.accessToken!);

  const { data: book } = await supabase
    .from("account_books")
    .select("id")
    .eq("id", bookId)
    .maybeSingle();

  if (!book) {
    res.status(404).json({ error: "Account book not found" });
    return;
  }

  let query = supabase
    .from("ledger_entries")
    .select("*")
    .eq("account_book_id", bookId)
    .order("entry_date", { ascending: true })
    .order("created_at", { ascending: true });

  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  if (from) query = query.gte("entry_date", from);
  if (to) query = query.lte("entry_date", to);

  const { data, error } = await query;

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

entriesRouter.post("/", async (req: AuthRequest, res: Response) => {
  const bookId = req.params.bookId;
  const parsed = createEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const supabase = createUserClient(req.accessToken!);
  const { data: book } = await supabase
    .from("account_books")
    .select("id")
    .eq("id", bookId)
    .maybeSingle();

  if (!book) {
    res.status(404).json({ error: "Account book not found" });
    return;
  }

  const { data, error } = await supabase
    .from("ledger_entries")
    .insert({
      account_book_id: bookId,
      entry_type: parsed.data.entry_type,
      amount: parsed.data.amount,
      party_name: parsed.data.party_name,
      category: parsed.data.category ?? "",
      remarks: parsed.data.remarks ?? "",
      entry_date: parsed.data.entry_date ?? new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json(data);
});

export const entryByIdRouter = Router();

entryByIdRouter.patch("/:entryId", async (req: AuthRequest, res: Response) => {
  const parsed = updateEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const supabase = createUserClient(req.accessToken!);
  const { data, error } = await supabase
    .from("ledger_entries")
    .update(parsed.data)
    .eq("id", req.params.entryId)
    .select()
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.json(data);
});

entryByIdRouter.delete("/:entryId", async (req: AuthRequest, res: Response) => {
  const supabase = createUserClient(req.accessToken!);
  const { error, count } = await supabase
    .from("ledger_entries")
    .delete({ count: "exact" })
    .eq("id", req.params.entryId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (count === 0) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.status(204).send();
});
