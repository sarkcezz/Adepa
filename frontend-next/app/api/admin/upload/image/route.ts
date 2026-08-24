import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** POST /admin/upload/image — stores a product/event/announcement image on Vercel Blob. */
export async function POST(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return fail("Image storage isn't configured yet (BLOB_READ_WRITE_TOKEN missing).", 501);
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  if (!file || !(file instanceof File)) return fail("No image provided.", 422);
  if (!ALLOWED.has(file.type)) return fail("Choose a JPG, PNG, WEBP, or GIF image.", 422);
  if (file.size > MAX_BYTES) return fail("Image must be 10MB or smaller.", 422);

  const ext = file.type.split("/")[1];
  const key = `products/${crypto.randomUUID()}.${ext}`;

  const blob = await put(key, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: false,
  });

  return json({ url: blob.url }, 201);
}
