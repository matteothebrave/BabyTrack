import { useState, useEffect, useCallback } from "react";

export interface AuthUser {
  id: number;
  role: "dad" | "mom";
  name: string;
}

export interface UserStatus {
  role: string;
  name: string;
  hasPin: boolean;
}

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, { credentials: "include", ...init });
  return res;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    try {
      const res = await apiFetch("/api/auth/me");
      if (res.ok) {
        setUser(await res.json());
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  const logout = useCallback(async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const login = useCallback(async (role: string, pin: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, pin }),
      });
      if (res.ok) {
        const u = await res.json();
        setUser(u);
        return { ok: true };
      }
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.message };
    } catch {
      return { ok: false, error: "Network error" };
    }
  }, []);

  return { user, loading, logout, login };
}

export async function fetchUserStatuses(): Promise<UserStatus[]> {
  const res = await fetch("/api/auth/status", { credentials: "include" });
  if (!res.ok) return [];
  return res.json();
}
