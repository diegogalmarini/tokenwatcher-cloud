// dashboard/tokenwatcher-app/src/lib/useWatchers.ts
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type Watcher = {
  id: number;
  owner_id: number;
  name: string;
  token_address: string;
  threshold: number;
  is_active: boolean;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
};

export type WatcherCreatePayload = {
  name: string;
  token_address: string;
  threshold: number;
  webhook_url: string;
  is_active?: boolean;
};

export type WatcherUpdatePayload = {
  name?: string;
  token_address?: string;
  threshold?: number;
  webhook_url?: string | null;
  is_active?: boolean;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function useWatchers() {
  const { token, logout } = useAuth();
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchers = useCallback(async () => {
    if (!token) {
      setWatchers([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/watchers/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        if (res.status === 401) {
          setError("Your session may have expired. Please login again.");
          logout();
        } else {
          const errorData = await res.json().catch(() => ({ detail: `Failed to fetch watchers, status: ${res.status}` }));
          setError(errorData.detail || `Failed to fetch watchers, status: ${res.status}`);
        }
        setWatchers([]);
        return;
      }
      const data: Watcher[] = await res.json();
      setWatchers(data);
    } catch (err: unknown) {
      console.error("fetchWatchers error:", err);
      let errorMessage = "An unexpected error occurred while fetching watchers.";
      if (err instanceof Error) errorMessage = err.message;
      else if (typeof err === 'string') errorMessage = err;
      setError(errorMessage);
      setWatchers([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, logout]);

  const createWatcher = useCallback(async (payload: WatcherCreatePayload) => {
    if (!token) throw new Error("Not authenticated");
    
    setIsLoading(true);
    setError(null);
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
    } catch (err) { // El catch ahora es más simple
      console.error("createWatcher error:", err);
      setIsLoading(false);
      throw err; // Solo relanzamos el error para que el formulario lo maneje
    }
  }, [token, fetchWatchers]);

  const updateWatcher = useCallback(async (id: number, payload: WatcherUpdatePayload) => {
    if (!token) throw new Error("Not authenticated");

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/watchers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: `Failed to update watcher, status: ${res.status}` }));
        throw new Error(errorData.detail || `Server error: ${res.status}`);
      }
      await fetchWatchers();
    } catch (err) {
      console.error("updateWatcher error:", err);
      setIsLoading(false);
      throw err;
    }
  }, [token, fetchWatchers]);

  const deleteWatcher = useCallback(async (id: number) => {
    if (!token) throw new Error("Not authenticated");
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/watchers/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok && res.status !== 204) {
        const errorData = await res.json().catch(() => ({ detail: `Failed to delete watcher, status: ${res.status}` }));
        throw new Error(errorData.detail || `Server error: ${res.status}`);
      }
      await fetchWatchers();
    } catch (err) {
      console.error("deleteWatcher error:", err);
      setIsLoading(false);
      throw err;
    }
  }, [token, fetchWatchers]);

  useEffect(() => {
    if (token) {
      fetchWatchers();
    } else {
      setWatchers([]);
    }
  }, [token, fetchWatchers]);


  return {
    watchers,
    isLoading,
    error,
    fetchWatchers,
    createWatcher,
    updateWatcher,
    deleteWatcher,
  };
}