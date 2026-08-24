import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * POST /admin/upload/image — issues a client upload token for Vercel Blob.
 *
 * The file itself never passes through this function: Vercel's serverless
 * functions enforce a hard request-body size cap well under what a product
 * photo needs, so routing the bytes through here would 413 before our code
 * even ran. Instead the browser uploads straight to Blob storage using a
 * short-lived signed token minted below (@vercel/blob/client's pattern).
 */
export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return fail("Image storage isn't configured yet (BLOB_READ_WRITE_TOKEN missing).", 501);
  }

  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const body = (await req.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED,
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: false,
      }),
    });
    return json(result);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Upload failed.", 400);
  }
}
