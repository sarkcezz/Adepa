"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { homeFor } from "@/lib/auth-redirect";
import type { User } from "@/lib/types";

/** Lands here after Google OAuth — the token arrives in the URL hash so it's never logged server-side. */
export default function OAuthCallbackPage() {
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get("token");
    const next = hash.get("next");

    if (!token) {
      toast.error("Could not complete sign-in.");
      router.replace("/login");
      return;
    }

    api<User>("/account", { token })
      .then((user) => {
        setAuth(user, token);
        toast.success("Welcome back!");
        router.replace(homeFor(user.role, next));
      })
      .catch((e) => {
        toast.error(e instanceof ApiError ? e.message : "Could not complete sign-in.");
        router.replace("/login");
      });
  }, [router, setAuth]);

  return (
    <div className="grid min-h-[50svh] place-items-center">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  );
}
