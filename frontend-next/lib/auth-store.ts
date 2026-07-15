"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "./api";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterInput) => Promise<User>;
  employeeLogin: (employeeId: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  ref?: string;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      setUser: (user) => set({ user }),

      async login(email, password) {
        const res = await api<{ user: User; token: string }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        set({ user: res.user, token: res.token });
        return res.user;
      },

      async register(data) {
        const res = await api<{ user: User; token: string }>("/auth/register", {
          method: "POST",
          body: JSON.stringify(data),
        });
        set({ user: res.user, token: res.token });
        return res.user;
      },

      async employeeLogin(employeeId, password) {
        const res = await api<{ user: User; token: string }>("/auth/employee/login", {
          method: "POST",
          body: JSON.stringify({ employee_id: employeeId, password }),
        });
        set({ user: res.user, token: res.token });
        return res.user;
      },

      async logout() {
        const { token } = get();
        try {
          if (token) await api("/auth/logout", { method: "POST", token });
        } catch {
          /* token may already be invalid — clear locally regardless */
        }
        set({ user: null, token: null });
      },
    }),
    { name: "adepa-auth" },
  ),
);
