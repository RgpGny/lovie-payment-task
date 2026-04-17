import Link from "next/link";

import { DashboardTabs } from "@/components/dashboard-tabs";
import { buttonVariants } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <Link href="/requests/new" className={buttonVariants({ size: "sm" })}>
          New request
        </Link>
      </div>
      <DashboardTabs />
    </div>
  );
}
