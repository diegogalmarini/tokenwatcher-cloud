// dashboard/tokenwatcher-app/src/lib/useWatchers.ts

import { useState } from "react";

export type Watcher = {
  id: number;
  token_address: string;
  threshold: number;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
};

const API_BASE = ""; // con el rewrite de next.config.js usamos rutas relativas

export function useWatchers() {
  const [watchers, setWatchers] = useState<Watcher[]>([]);

  /** 1) Trae la lista completa */
  async function fetchWatchers() {
    const res = await fetch(`${API_BASE}/api/watchers`);
    if (!res.ok) throw new Error("Failed to fetch watchers");
    const data: Watcher[] = await res.json();
    setWatchers(data);
  }

  /** 2) Crea un nuevo watcher */
  async function createWatcher(payload: {
    token_address: string;
    threshold: number;
    webhook_url: string | null;
  }) {
    const res = await fetch(`${API_BASE}/api/watchers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create watcher");
    const created: Watcher = await res.json();
    // Lo añadimos arriba para verlo primero
    setWatchers((cur) => [created, ...cur]);
  }

  /** 3) Actualiza un watcher existente */
  async function updateWatcher(w: Watcher) {
    const res = await fetch(`${API_BASE}/api/watchers/${w.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token_address: w.token_address,
        threshold: w.threshold,
        webhook_url: w.webhook_url,
      }),
    });
    if (!res.ok) throw new Error("Failed to update watcher");
    const updated: Watcher = await res.json();
    setWatchers((cur) => cur.map((x) => (x.id === updated.id ? updated : x)));
  }

  /** 4) Borra un watcher por ID */
  async function deleteWatcher(id: number) {
    const res = await fetch(`${API_BASE}/api/watchers/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete watcher");
    setWatchers((cur) => cur.filter((x) => x.id !== id));
  }

  return {
    watchers,
    fetchWatchers,
    createWatcher,
    updateWatcher,
    deleteWatcher,
  };
}
