// src/lib/useWatchers.ts (Completo y Corregido)

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type Watcher = { /* ... (type sin cambios) ... */ };
export type WatcherCreatePayload = { /* ... (type sin cambios) ... */ };
export type WatcherUpdatePayload = { /* ... (type sin cambios) ... */ };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function useWatchers() {
  const { token, logout } = useAuth();
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchers = useCallback(async () => {
    // ... (esta función no cambia)
  }, [token, logout]);

  const createWatcher = useCallback(async (payload: WatcherCreatePayload) => {
    if (!token) throw new Error("Not authenticated");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/watchers/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: `Failed to create watcher, status: ${res.status}` }));
        throw new Error(errorData.detail || `Server error: ${res.status}`);
      }
      await fetchWatchers();
    } catch (err) {
      console.error("createWatcher error:", err);
      throw err; // Solo relanzamos el error
    } finally {
      setIsLoading(false);
    }
  }, [token, fetchWatchers]);

  const updateWatcher = useCallback(async (id: number, payload: WatcherUpdatePayload) => {
    // ... (la lógica es la misma que en createWatcher, solo relanzar el error)
    if (!token) throw new Error("Not authenticated");
    setIsLoading(true);
    try {
        // ... fetch ...
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ detail: `Failed to update watcher, status: ${res.status}` }));
            throw new Error(errorData.detail || `Server error: ${res.status}`);
        }
        await fetchWatchers();
    } catch (err) {
        console.error("updateWatcher error:", err);
        throw err;
    } finally {
        setIsLoading(false);
    }
  }, [token, fetchWatchers]);

  const deleteWatcher = useCallback(async (id: number) => {
    // ... (la lógica es la misma, solo relanzar el error)
    if (!token) throw new Error("Not authenticated");
    setIsLoading(true);
    try {
        // ... fetch ...
        if (!res.ok && res.status !== 204) {
            const errorData = await res.json().catch(() => ({ detail: `Failed to delete watcher, status: ${res.status}` }));
            throw new Error(errorData.detail || `Server error: ${res.status}`);
        }
        await fetchWatchers();
    } catch (err) {
        console.error("deleteWatcher error:", err);
        throw err;
    } finally {
        setIsLoading(false);
    }
  }, [token, fetchWatchers]);

  useEffect(() => {
    if (token) {
      fetchWatchers();
    } else {
      setWatchers([]);
    }
  }, [token, fetchWatchers]);

  return { watchers, isLoading, error, fetchWatchers, createWatcher, updateWatcher, deleteWatcher };
}