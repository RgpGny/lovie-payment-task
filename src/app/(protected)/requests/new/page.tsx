import Link from "next/link";
import { redirect } from "next/navigation";

import { RequestForm } from "@/components/request-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function NewRequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) redirect("/login?next=/requests/new");

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">New request</h1>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Back to dashboard
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Ask someone for money
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RequestForm callerEmail={user.email} />
        </CardContent>
      </Card>
    </div>
  );
}
