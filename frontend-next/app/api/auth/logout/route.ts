import { json } from "@/app/api/_lib/http";
import { revokeToken } from "@/app/api/_lib/auth";

export async function POST(req: Request) {
  await revokeToken(req);
  return json({ message: "Logged out." });
}
