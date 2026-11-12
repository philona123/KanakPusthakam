"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

export function AppHeader({ title }: { title?: string }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-amber-900/10 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href="/books"
            className="shrink-0 text-base font-bold tracking-tight text-amber-950 sm:text-lg"
          >
            Kanak Pusthakam
          </Link>
          {title && (
            <span className="truncate text-sm text-stone-500">/ {title}</span>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          className="!py-2 !px-3 text-sm"
          onClick={signOut}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
