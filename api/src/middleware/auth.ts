import type { Request, Response, NextFunction } from "express";
import type { User } from "@supabase/supabase-js";
import { createAnonClient } from "../lib/supabase.js";

export interface AuthRequest extends Request {
  user?: User;
  accessToken?: string;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = header.slice(7);
  const supabase = createAnonClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = data.user;
  req.accessToken = token;
  next();
}
