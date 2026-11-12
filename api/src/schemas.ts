import { z } from "zod";

export const createAccountBookSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const updateAccountBookSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
});

export const createEntrySchema = z.object({
  entry_type: z.enum(["credit", "debit"]),
  amount: z.coerce.number().positive(),
  party_name: z.string().min(1).max(500),
  category: z.string().max(200).optional().default(""),
  remarks: z.string().max(2000).optional().default(""),
  entry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const updateEntrySchema = z.object({
  entry_type: z.enum(["credit", "debit"]).optional(),
  amount: z.coerce.number().positive().optional(),
  party_name: z.string().min(1).max(500).optional(),
  category: z.string().max(200).optional(),
  remarks: z.string().max(2000).optional(),
  entry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type LedgerEntryRow = {
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

export type AccountBookRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
};
