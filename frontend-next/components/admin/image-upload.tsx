"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { Label } from "@/components/ui/label";

/** Single-image uploader backed by Vercel Blob's client-upload flow. */
export function ImageUpload({
  value, onChange, folder, label = "Image",
}: { value: string; onChange: (url: string) => void; folder: string; label?: string }) {
  const token = useAuth((s) => s.token);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handle(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file.");
    if (file.size > 10 * 1024 * 1024) return toast.error("Max 10MB.");
    setUploading(true);
    try {
      const ext = file.type.split("/")[1] || "jpg";
      const blob = await upload(`${folder}/${crypto.randomUUID()}.${ext}`, file, {
        access: "public",
        handleUploadUrl: `${API_BASE}/admin/upload/image`,
        contentType: file.type,
        headers: { Authorization: `Bearer ${token}` },
      });
      onChange(blob.url);
      toast.success("Image uploaded.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
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
