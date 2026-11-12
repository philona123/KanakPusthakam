import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

const url = requireEnv("SUPABASE_URL");
const anonKey = requireEnv("SUPABASE_ANON_KEY");

/** Node 20 has no global WebSocket; required by @supabase/supabase-js 2.114+ */
const baseClientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: WebSocket as unknown as typeof globalThis.WebSocket,
  },
};

export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(url, anonKey, {
    ...baseClientOptions,
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

export function createAnonClient(): SupabaseClient {
  return createClient(url, anonKey, baseClientOptions);
}
