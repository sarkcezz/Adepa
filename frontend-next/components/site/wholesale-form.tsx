"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { SEGMENTS } from "@/lib/wholesale-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EMPTY = {
  business_name: "", contact_name: "", business_type: "", email: "", phone: "", estimated_volume: "", message: "",
};

export function WholesaleForm() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await api("/wholesale", { method: "POST", body: JSON.stringify(form) });
      setSent(true);
      toast.success("Thanks — we'll be in touch within 1-2 business days.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not submit. Try WhatsApp instead.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-6 py-8 text-center sm:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Request received</h2>
        <p className="mt-2 text-muted-foreground">We&apos;ll reach out to {form.email} shortly.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Request a quote</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Business name" value={form.business_name} onChange={(v) => setForm({ ...form, business_name: v })} />
        <Field label="Contact name" value={form.contact_name} onChange={(v) => setForm({ ...form, contact_name: v })} />
        <div className="space-y-1.5">
          <Label className="text-xs">Business type</Label>
          <select
            className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"
            value={form.business_type}
            onChange={(e) => setForm({ ...form, business_type: e.target.value })}
          >
            <option value="">Select one</option>
            {SEGMENTS.map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}
          </select>
        </div>
        <Field label="Estimated volume (optional)" value={form.estimated_volume} onChange={(v) => setForm({ ...form, estimated_volume: v })} placeholder="e.g. 50kg/week" />
        <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs">Tell us what you need (optional)</Label>
          <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
      </div>
      <Button className="mt-5 w-full rounded-full sm:w-auto" size="lg" disabled={submitting} onClick={submit}>
        {submitting ? "Sending…" : "Request a quote"}
      </Button>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
