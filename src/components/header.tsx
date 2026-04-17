import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          PayRequest
        </Link>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {user?.email ? (
            <>
              <span className="hidden sm:inline">{user.email}</span>
              <SignOutButton />
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
