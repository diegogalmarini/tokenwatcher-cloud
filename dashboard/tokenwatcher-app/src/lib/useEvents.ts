// src/lib/useEvents.ts

import { useCallback, useState, useEffect } from "react";

export interface Event {
  id: number;
  watcher_id: number;
  token_address: string;
  event_type: string;
  block_number: number;
  transaction_hash: string;
  amount: number;
  created_at: string;
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/events/");
      if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
      const data = await res.json();
      setEvents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(
    async (evt: Omit<Event, "id" | "created_at">) => {
      const res = await fetch("/api/events/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evt),
      });
      if (!res.ok) throw new Error(`Create failed ${res.status}`);
      return res.json();
    },
    []
  );

  const deleteEvent = useCallback(async (id: number) => {
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Delete failed ${res.status}`);
    // no content return
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    deleteEvent,
  };
}
