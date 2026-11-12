-- account_books
CREATE TABLE IF NOT EXISTS public.account_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS account_books_user_id_idx ON public.account_books(user_id);

ALTER TABLE public.account_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_books_select ON public.account_books
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY account_books_insert ON public.account_books
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY account_books_update ON public.account_books
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY account_books_delete ON public.account_books
  FOR DELETE USING (user_id = auth.uid());

-- ledger_entries
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_book_id UUID NOT NULL REFERENCES public.account_books(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('credit', 'debit')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  party_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  remarks TEXT NOT NULL DEFAULT '',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ledger_entries_book_date_idx
  ON public.ledger_entries(account_book_id, entry_date DESC, created_at DESC);

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY ledger_entries_select ON public.ledger_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.account_books b
      WHERE b.id = ledger_entries.account_book_id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY ledger_entries_insert ON public.ledger_entries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.account_books b
      WHERE b.id = ledger_entries.account_book_id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY ledger_entries_update ON public.ledger_entries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.account_books b
      WHERE b.id = ledger_entries.account_book_id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY ledger_entries_delete ON public.ledger_entries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.account_books b
      WHERE b.id = ledger_entries.account_book_id AND b.user_id = auth.uid()
    )
  );
