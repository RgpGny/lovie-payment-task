"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dollarsToCents, MAX_AMOUNT_CENTS } from "@/lib/money";
import { createRequestSchema } from "@/lib/validators";

type FieldErrors = Partial<{
  recipient_email: string;
  amount: string;
  note: string;
  form: string;
}>;

export function RequestForm({ callerEmail }: { callerEmail: string }) {
  const router = useRouter();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const cents = dollarsToCents(amount);
    if (cents === null) {
      setErrors({ amount: "Enter an amount between $0.01 and $999,999.99" });
      return;
    }

    const parsed = createRequestSchema.safeParse({
      recipient_email: recipient,
      amount_cents: cents,
      note: note.trim() ? note.trim() : null,
    });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const path = String(issue.path[0] ?? "form");
        if (path === "recipient_email") next.recipient_email = issue.message;
        else if (path === "amount_cents") next.amount = issue.message;
        else if (path === "note") next.note = issue.message;
        else next.form = issue.message;
      }
      setErrors(next);
      return;
    }

    if (parsed.data.recipient_email === callerEmail.toLowerCase()) {
      setErrors({ recipient_email: "You can't request money from yourself" });
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        if (payload?.error === "self_request") {
          setErrors({ recipient_email: "You can't request money from yourself" });
          return;
        }
        if (payload?.error === "invalid" && payload.field) {
          const field = String(payload.field);
          if (field === "amount_cents") setErrors({ amount: payload.message });
          else if (field === "recipient_email")
            setErrors({ recipient_email: payload.message });
          else if (field === "note") setErrors({ note: payload.message });
          else setErrors({ form: payload.message ?? "Invalid submission" });
          return;
        }
        toast.error("Couldn't create request", {
          description: payload?.message ?? "Unexpected error",
        });
        return;
      }

      const data = (await response.json()) as { id: string };
      router.push(`/requests/${data.id}/success`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="recipient">Recipient email</Label>
        <Input
          id="recipient"
          name="recipient"
          type="email"
          autoComplete="email"
          required
          placeholder="bob@payrequest.test"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          aria-invalid={errors.recipient_email ? true : undefined}
        />
        {errors.recipient_email ? (
          <p className="text-xs text-red-600">{errors.recipient_email}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (USD)</Label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
            $
          </span>
          <Input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            placeholder="25.00"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-6"
            aria-invalid={errors.amount ? true : undefined}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Maximum ${new Intl.NumberFormat("en-US").format(MAX_AMOUNT_CENTS / 100)}.
        </p>
        {errors.amount ? (
          <p className="text-xs text-red-600">{errors.amount}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Input
          id="note"
          name="note"
          type="text"
          maxLength={200}
          placeholder="Pizza last night"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-invalid={errors.note ? true : undefined}
        />
        <p className="text-xs text-muted-foreground">
          {note.length}/200 characters.
        </p>
        {errors.note ? <p className="text-xs text-red-600">{errors.note}</p> : null}
      </div>

      {errors.form ? (
        <p className="text-sm text-red-600" role="alert">
          {errors.form}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending request…" : "Send request"}
      </Button>
    </form>
  );
}
