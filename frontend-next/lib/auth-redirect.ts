import type { Role } from "./types";

/** Every sign-in path (password, employee ID, Google) lands home through this one rule. */
export function homeFor(role: Role, next?: string | null): string {
  if (next) return next;
  if (role === "admin") return "/admin";
  if (role === "employee") return "/staff";
  return "/account";
}
