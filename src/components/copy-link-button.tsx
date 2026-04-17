"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyLinkButton({ shareLink }: { shareLink: string }) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/pay/${shareLink}`
      : `/pay/${shareLink}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select and copy manually");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code
        className="flex-1 truncate rounded-md border border-border bg-muted px-3 py-2 text-xs"
        data-testid="share-link"
      >
        {url}
      </code>
      <Button type="button" onClick={copy} variant="secondary" size="sm">
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
