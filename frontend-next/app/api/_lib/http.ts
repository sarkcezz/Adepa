import { NextResponse } from "next/server";

/** JSON success response. */
export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/** Error in the Laravel shape the frontend expects: `{ message }`. */
export function fail(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

/** 422 validation error: `{ message, errors }` — mirrors Laravel. */
export function validationError(errors: Record<string, string[]>) {
  return NextResponse.json(
    { message: "The given data was invalid.", errors },
    { status: 422 },
  );
}

/** Parse a JSON body, returning `{}` on empty/invalid rather than throwing. */
export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

/** Laravel-style paginator envelope. */
export function paginate<T>(rows: T[], page = 1, perPage = rows.length || 1) {
  return {
    data: rows,
    current_page: page,
    last_page: Math.max(1, Math.ceil(rows.length / perPage)),
    total: rows.length,
  };
}
