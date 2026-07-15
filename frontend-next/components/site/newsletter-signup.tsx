"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await api("/newsletter", { method: "POST", body: JSON.stringify({ email: email.trim() }) });
      toast.success("Subscribed! Watch your inbox for deals.");
      setEmail("");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not subscribe.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 flex max-w-xs gap-2">
      <Input
        type="email"
        required
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-9"
      />
      <button
        type="submit"
        disabled={submitting}
        aria-label="Subscribe"
        className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        <Send className="size-4" />
      </button>
    </form>
  );
}
