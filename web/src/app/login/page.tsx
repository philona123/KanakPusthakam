"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert, Button, Card, Input, PageShell } from "@/components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    setMessage("Check your email for the magic link to sign in.");
  }

  return (
    <PageShell>
      <div className="flex min-h-dvh items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-6 sm:p-8">
          <div className="mb-6 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-800">
              Cash book
            </p>
            <h1 className="mt-2 text-2xl font-bold text-stone-900">
              Kanak Pusthakam
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              Sign in with a one-time link sent to your email. No password
              needed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-stone-700">
              Email address
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2"
              />
            </label>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending…" : "Send magic link"}
            </Button>
          </form>

          {message && (
            <div className="mt-4">
              <Alert tone="success">{message}</Alert>
            </div>
          )}
          {error && (
            <div className="mt-4">
              <Alert tone="error">{error}</Alert>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
