import { randomInt } from "crypto";
import { like, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";

/** Next employee code: APH-0001, from the current max. */
export async function nextEmployeeId(): Promise<string> {
  const [row] = await db
    .select({
      max: sql<number>`COALESCE(MAX(CAST(SUBSTRING(${users.employee_id} FROM 5) AS INTEGER)), 0)`,
    })
    .from(users)
    .where(like(users.employee_id, "APH-%"));
  return "APH-" + String((row?.max ?? 0) + 1).padStart(4, "0");
}

/** Human-friendly temporary password (no ambiguous characters). */
export function tempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[randomInt(chars.length)];
  return s;
}

type Actor = { id: string; name: string; role: string };

/** Best-effort audit log — never blocks the request it records. */
export async function audit(
  actor: Actor,
  action: string,
  opts: {
    subject_type?: string;
    subject_id?: string;
    subject_label?: string;
    changes?: Record<string, unknown>;
    note?: string;
  } = {},
) {
  try {
    await db.insert(auditLogs).values({
      user_id: actor.id,
      user_name: actor.name,
      user_role: actor.role,
      action,
      subject_type: opts.subject_type ?? null,
      subject_id: opts.subject_id ?? null,
      subject_label: opts.subject_label ?? null,
      changes: opts.changes ?? null,
      note: opts.note ?? null,
    });
  } catch {
    /* auditing must not break the operation */
  }
}
