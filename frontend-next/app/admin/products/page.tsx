"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Power, Upload, Loader2, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { api, API_BASE } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatGhs, formatWeight, PRODUCT_LINE_LABEL, PRODUCT_CATEGORIES, CATEGORY_LABEL } from "@/lib/format";
import type { Product, Paginated, ProductLine, ProductVariant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

type Draft = {
  id?: string;
  name: string;
  product_line: ProductLine;
  variant: ProductVariant;
  weight_grams: number | "";
  price_ghs: string;
  heat_level: number;
  stock_qty: number;
  description: string;
  image_url: string;
  gallery_urls: string[];
  category: string;
  nutrition_info: string;
  cooking_tips: string;
  is_active: boolean;
};

const EMPTY: Draft = {
  name: "", product_line: "RAW", variant: "PLAIN", weight_grams: 500,
  price_ghs: "", heat_level: 0, stock_qty: 0, description: "", image_url: "", gallery_urls: [],
  category: "", nutrition_info: "", cooking_tips: "", is_active: true,
};

export default function AdminProductsPage() {
  const token = useAuth((s) => s.token);
  const [items, setItems] = useState<Product[] | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);

  function load() {
    if (!token) return;
    api<Paginated<Product>>("/admin/products", { token })
      .then((r) => setItems(r.data))
      .catch(() => setItems([]));
  }
  useEffect(load, [token]);  

  function startCreate() {
    setDraft(EMPTY);
    setOpen(true);
  }
  function startEdit(p: Product) {
    setDraft({
      id: p.id, name: p.name, product_line: p.product_line, variant: p.variant,
      weight_grams: p.weight_grams ?? "", price_ghs: (p.price_kobo / 100).toFixed(2),
      heat_level: p.heat_level, stock_qty: p.stock_qty, description: p.description,
      image_url: p.image_url ?? "", gallery_urls: p.gallery_urls ?? [], category: p.category ?? "",
      nutrition_info: p.nutrition_info ?? "", cooking_tips: p.cooking_tips ?? "",
      is_active: p.is_active,
    });
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    const body = {
      name: draft.name,
      product_line: draft.product_line,
      variant: draft.variant,
      weight_grams: draft.weight_grams === "" ? null : Number(draft.weight_grams),
      price_kobo: Math.round(parseFloat(draft.price_ghs || "0") * 100),
      heat_level: draft.heat_level,
      stock_qty: draft.stock_qty,
      description: draft.description,
      image_url: draft.image_url || null,
      gallery_urls: draft.gallery_urls.length ? draft.gallery_urls : null,
      category: draft.category || null,
      nutrition_info: draft.nutrition_info || null,
      cooking_tips: draft.cooking_tips || null,
      is_active: draft.is_active,
    };
    try {
      if (draft.id) {
        await api(`/admin/products/${draft.id}`, { method: "PUT", token: token!, body: JSON.stringify(body) });
        toast.success("Product updated.");
      } else {
        await api("/admin/products", { method: "POST", token: token!, body: JSON.stringify(body) });
        toast.success("Product created.");
      }
      setOpen(false);
      load();
    } catch {
      toast.error("Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(p: Product) {
    try {
      await api(`/admin/products/${p.id}/toggle`, { method: "PATCH", token: token! });
      setItems((prev) => prev?.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)) ?? null);
    } catch {
      toast.error("Could not toggle.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Products</h1>
        <Button className="rounded-full" onClick={startCreate}>
          <Plus className="size-4" /> Add product
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        {items === null ? (
          <div className="space-y-px p-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Line</th>
                  <th className="px-4 py-3 font-semibold">Size</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t border-border/60">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{PRODUCT_LINE_LABEL[p.product_line]}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatWeight(p.weight_grams) || "—"}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{formatGhs(p.price_kobo)}</td>
                    <td className="px-4 py-3 tabular-nums">{p.stock_qty}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {p.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(p)} className="rounded-lg p-2 hover:bg-secondary" aria-label="Edit"><Pencil className="size-4" /></button>
                        <button onClick={() => toggle(p)} className="rounded-lg p-2 hover:bg-secondary" aria-label="Toggle"><Power className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-lg">
          <SheetTitle className="sr-only">{draft.id ? "Edit product" : "New product"}</SheetTitle>
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {draft.id ? "Edit product" : "New product"}
            </h2>
          </div>
          <div className="space-y-4 p-6">
            <ImageUpload value={draft.image_url} onChange={(url) => setDraft({ ...draft, image_url: url })} />
            <GalleryUpload value={draft.gallery_urls} onChange={(urls) => setDraft({ ...draft, gallery_urls: urls })} />

            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Line</Label>
                <select className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm" value={draft.product_line} onChange={(e) => setDraft({ ...draft, product_line: e.target.value as ProductLine })}>
                  <option value="RAW">Raw</option>
                  <option value="SPICED">Spiced</option>
                  <option value="READY_TO_EAT">Ready to eat</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Variant</Label>
                <select className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm" value={draft.variant} onChange={(e) => setDraft({ ...draft, variant: e.target.value as ProductVariant })}>
                  <option value="NONE">None</option>
                  <option value="PLAIN">Plain</option>
                  <option value="MILD">Mild</option>
                  <option value="SPICY">Spicy</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Weight (g)</Label>
                <Input type="number" value={draft.weight_grams} onChange={(e) => setDraft({ ...draft, weight_grams: e.target.value === "" ? "" : Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Price (GHS)</Label>
                <Input type="number" step="0.01" value={draft.price_ghs} onChange={(e) => setDraft({ ...draft, price_ghs: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Stock</Label>
                <Input type="number" value={draft.stock_qty} onChange={(e) => setDraft({ ...draft, stock_qty: Number(e.target.value) })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Heat level (0–5)</Label>
              <Input type="number" min={0} max={5} value={draft.heat_level} onChange={(e) => setDraft({ ...draft, heat_level: Number(e.target.value) })} />
            </div>

            <div className="space-y-1.5">
              <Label>Shop category</Label>
              <select
                className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                <option value="">— None —</option>
                {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Nutrition info (optional)</Label>
              <textarea
                rows={2}
                placeholder="e.g. Per 100g: 242 kcal, 27g protein, 14g fat"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={draft.nutrition_info}
                onChange={(e) => setDraft({ ...draft, nutrition_info: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Cooking tips (optional)</Label>
              <textarea
                rows={2}
                placeholder="e.g. Grill 6-8 min per side over medium-high heat"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={draft.cooking_tips}
                onChange={(e) => setDraft({ ...draft, cooking_tips: e.target.value })}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} className="size-4 accent-primary" />
              Active (visible in store)
            </label>

            <Button className="w-full rounded-full" size="lg" disabled={saving} onClick={save}>
              {saving ? "Saving…" : draft.id ? "Save changes" : "Create product"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const token = useAuth((s) => s.token);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handle(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file.");
    if (file.size > 10 * 1024 * 1024) return toast.error("Max 10MB.");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API_BASE}/admin/upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { url: string };
      onChange(data.url);
      toast.success("Image uploaded.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>Image</Label>
      {value ? (
        <div className="relative inline-block">
          <Image src={value} alt="" width={160} height={160} className="size-40 rounded-xl object-cover" />
          <button onClick={() => onChange("")} className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-destructive text-white" aria-label="Remove image">
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/30 py-8 text-sm hover:border-primary hover:bg-primary/5"
        >
          {uploading ? <Loader2 className="size-6 animate-spin text-primary" /> : <Upload className="size-6 text-primary" />}
          <span className="font-medium">{uploading ? "Uploading…" : "Click to upload"}</span>
          <span className="text-xs text-muted-foreground">JPG, PNG, WEBP · max 10MB</span>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }} />
    </div>
  );
}

/** Extra gallery photos beyond the main image. */
function GalleryUpload({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const token = useAuth((s) => s.token);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handle(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file.");
    if (file.size > 10 * 1024 * 1024) return toast.error("Max 10MB.");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API_BASE}/admin/upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { url: string };
      onChange([...value, data.url]);
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>Gallery photos (optional)</Label>
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={url + i} className="relative">
            <Image src={url} alt="" width={64} height={64} className="size-16 rounded-lg object-cover" />
            <button
              onClick={() => onChange(value.filter((_, x) => x !== i))}
              className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-destructive text-white"
              aria-label="Remove photo"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="grid size-16 place-items-center rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5"
          aria-label="Add gallery photo"
        >
          {uploading ? <Loader2 className="size-4 animate-spin text-primary" /> : <Upload className="size-4 text-primary" />}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }} />
    </div>
  );
}
