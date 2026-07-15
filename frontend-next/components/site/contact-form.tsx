"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "" };

export function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await api("/contact", { method: "POST", body: JSON.stringify(form) });
      setSent(true);
      setForm(EMPTY);
      toast.success("Message sent — we'll reply soon.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not send. Try WhatsApp instead.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-6 py-8 text-center sm:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Message sent</h2>
        <p className="mt-2 text-muted-foreground">We usually reply within a business day.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Send us a message</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label="Phone (optional)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Subject" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs">Message</Label>
          <Textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
      </div>
      <Button className="mt-5 w-full rounded-full" size="lg" disabled={submitting} onClick={submit}>
        {submitting ? "Sending…" : "Send message"}
      </Button>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
