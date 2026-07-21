"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, KeyRound, Power, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { Paginated, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const POSITIONS = ["cashier", "stand_lead", "supervisor", "manager"] as const;
const POS_LABEL: Record<string, string> = { cashier: "Cashier", stand_lead: "Stand Lead", supervisor: "Supervisor", manager: "Manager" };

type Draft = { id?: string; name: string; phone: string; email: string; position: string; password: string };
const EMPTY: Draft = { name: "", phone: "", email: "", position: "cashier", password: "" };

export default function AdminEmployeesPage() {
  const token = useAuth((s) => s.token);
  const [items, setItems] = useState<User[] | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [temp, setTemp] = useState<{ name: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [resetting, setResetting] = useState(false);

  function load() {
    if (!token) return;
    api<Paginated<User>>("/admin/employees", { token }).then((r) => setItems(r.data)).catch(() => setItems([]));
  }
  useEffect(load, [token]);  

  function startEdit(e: User) {
    setDraft({ id: e.id, name: e.name, phone: e.phone, email: e.email || "", position: e.position || "cashier", password: "" });
    setOpen(true);
  }

  async function save() {
    if (!draft.id && draft.password && draft.password.length < 8) {
      return toast.error("Password must be at least 8 characters.");
    }
    setSaving(true);
    const body: Record<string, unknown> = { name: draft.name, phone: draft.phone, email: draft.email || null, position: draft.position };
    if (!draft.id && draft.password) body.password = draft.password;
    try {
      if (draft.id) {
        await api(`/admin/employees/${draft.id}`, { method: "PUT", token: token!, body: JSON.stringify(body) });
        toast.success("Employee updated.");
      } else {
        const res = await api<{ employee: User; temp_password: string }>("/admin/employees", { method: "POST", token: token!, body: JSON.stringify(body) });
        setTemp({ name: res.employee.name, password: res.temp_password });
      }
      setOpen(false); load();
    } catch { toast.error("Could not save employee."); }
    finally { setSaving(false); }
  }

  function openReset(e: User) {
    setResetPw("");
    setResetTarget(e);
  }

  async function submitReset() {
    if (!resetTarget) return;
    if (resetPw && resetPw.length < 8) return toast.error("Password must be at least 8 characters.");
    setResetting(true);
    try {
      const res = await api<{ temp_password: string }>(`/admin/employees/${resetTarget.id}/reset-password`, {
        method: "POST",
        token: token!,
        body: JSON.stringify(resetPw ? { password: resetPw } : {}),
      });
      setTemp({ name: resetTarget.name, password: res.temp_password });
      setResetTarget(null);
    } catch { toast.error("Could not reset."); }
    finally { setResetting(false); }
  }

  async function toggle(e: User) {
    try {
      await api(`/admin/employees/${e.id}/status`, { method: "PATCH", token: token!, body: JSON.stringify({ is_active: !e.is_active }) });
      setItems((prev) => prev?.map((x) => x.id === e.id ? { ...x, is_active: !x.is_active } : x) ?? null);
    } catch { toast.error("Could not toggle."); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Employees</h1>
        <Button className="rounded-full" onClick={() => { setDraft(EMPTY); setOpen(true); }}><Plus className="size-4" /> Add employee</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        {items === null ? (
          <div className="space-y-px p-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No employees yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="px-4 py-3 font-semibold">ID</th><th className="px-4 py-3 font-semibold">Name</th><th className="px-4 py-3 font-semibold">Phone</th><th className="px-4 py-3 font-semibold">Position</th><th className="px-4 py-3 font-semibold">Status</th><th /></tr>
              </thead>
              <tbody>
                {items.map((e) => (
                  <tr key={e.id} className="border-t border-border/60">
                    <td className="px-4 py-3 font-mono text-xs">{e.employee_id}</td>
                    <td className="px-4 py-3 font-medium">{e.name}{e.email && <div className="text-xs text-muted-foreground">{e.email}</div>}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.phone}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">{POS_LABEL[e.position || "cashier"]}</span></td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{e.is_active ? "Active" : "Disabled"}</span></td>
                    <td className="px-2 py-3"><div className="flex gap-1">
                      <button onClick={() => startEdit(e)} className="rounded-lg p-2 hover:bg-secondary" aria-label="Edit"><Pencil className="size-4" /></button>
                      <button onClick={() => openReset(e)} className="rounded-lg p-2 hover:bg-secondary" aria-label="Reset password"><KeyRound className="size-4" /></button>
                      <button onClick={() => toggle(e)} className="rounded-lg p-2 hover:bg-secondary" aria-label="Toggle"><Power className="size-4" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/edit */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
          <SheetTitle className="sr-only">{draft.id ? "Edit employee" : "New employee"}</SheetTitle>
          <div className="border-b border-border/60 px-6 py-4"><h2 className="font-[family-name:var(--font-display)] text-xl font-bold">{draft.id ? "Edit employee" : "New employee"}</h2></div>
          <div className="space-y-4 p-6">
            <div className="space-y-1.5"><Label>Full name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email (optional)</Label><Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
            {!draft.id && (
              <div className="space-y-1.5">
                <Label>Password (optional)</Label>
                <Input type="text" placeholder="Leave blank to auto-generate" minLength={8} value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} />
                <p className="text-xs text-muted-foreground">Set one yourself, or leave blank to generate a random temporary password. At least 8 characters.</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Position</Label>
              <select className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm" value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value })}>
                {POSITIONS.map((p) => <option key={p} value={p}>{POS_LABEL[p]}</option>)}
              </select>
            </div>
            <Button className="w-full rounded-full" size="lg" disabled={saving} onClick={save}>{saving ? "Saving…" : draft.id ? "Save changes" : "Create employee"}</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Reset password */}
      <Dialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>Reset password</DialogTitle>
          {resetTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Reset <strong className="text-foreground">{resetTarget.name}</strong>&apos;s password. This ends all of their active sessions.
              </p>
              <div className="space-y-1.5">
                <Label>New password (optional)</Label>
                <Input type="text" placeholder="Leave blank to auto-generate" minLength={8} value={resetPw} onChange={(e) => setResetPw(e.target.value)} />
                <p className="text-xs text-muted-foreground">Set one yourself, or leave blank to generate a random temporary password. At least 8 characters.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setResetTarget(null)}>Cancel</Button>
                <Button className="flex-1 rounded-full" disabled={resetting} onClick={submitReset}>{resetting ? "Resetting…" : "Reset password"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Temp password reveal */}
      <Dialog open={!!temp} onOpenChange={(o) => !o && setTemp(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>Temporary password</DialogTitle>
          {temp && (
            <div className="space-y-4">
              <p className="rounded-xl bg-accent/15 p-3 text-sm text-accent-foreground">Show once. {temp.name} must change it on first login. We&apos;ve also sent it by SMS.</p>
              <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-4">
                <code className="font-[family-name:var(--font-display)] text-lg font-bold text-primary">{temp.password}</code>
                <button onClick={() => { navigator.clipboard.writeText(temp.password); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold ring-1 ring-primary/20 hover:bg-primary hover:text-primary-foreground">
                  {copied ? <><Check className="size-3.5" /> Copied</> : <><Copy className="size-3.5" /> Copy</>}
                </button>
              </div>
              <Button className="w-full rounded-full" onClick={() => setTemp(null)}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
