// dashboard/tokenwatcher-app/src/lib/useEvents.ts
import { useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { EventFilters } from "@/components/events/EventFilterBar";

export interface Event {
  id: number;
  watcher_id: number;
  token_address_observed: string;
  token_symbol: string | null;
  token_name: string | null;
  amount: number;
  transaction_hash: string;
  block_number: number;
  created_at: string;
  from_address: string;
  to_address: string;
  usd_value: number | null;
}

export interface FetchEventsParams {
    filters: Partial<EventFilters>;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    skip?: number;
    limit?: number;
    activeWatchersOnly?: boolean; // <-- NUEVO PARÁMETRO
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function useEvents() {
  const { token, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchError = useCallback(async (response: Response, defaultErrorMessage: string) => {
    console.error(`[useEvents] handleFetchError. Status: ${response.status}, URL: ${response.url}`);
    if (response.status === 401) {
      setError("Your session may have expired or token is invalid. Please login again.");
      logout();
    } else {
      try {
        const errorData = await response.json();
        console.error("[useEvents] Error data from API:", errorData);
        setError(errorData.detail || defaultErrorMessage);
      } catch (e) {
        console.error("[useEvents] Error parsing error JSON:", e);
        setError(defaultErrorMessage);
      }
    }
    setEvents([]);
    setTotalEvents(0);
  }, [logout]);

  const fetchAllMyEvents = useCallback(async (params: FetchEventsParams) => {
    // Desestructuramos con un valor por defecto para activeWatchersOnly
    const { filters, sortBy = 'created_at', sortOrder = 'desc', skip = 0, limit = 100, activeWatchersOnly = false } = params;

    console.log("[useEvents] Attempting fetchAllMyEvents with params:", params);
    if (!token) {
      setError("Not authenticated to fetch events.");
      setEvents([]);
      setTotalEvents(0);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    const queryParams = new URLSearchParams({
        skip: String(skip),
        limit: String(limit),
        sort_by: sortBy,
        sort_order: sortOrder,
    });

    if (filters.tokenAddress) queryParams.append('token_address', filters.tokenAddress);
    if (filters.startDate) queryParams.append('start_date', filters.startDate);
    if (filters.endDate) queryParams.append('end_date', filters.endDate);
    if (filters.fromAddress) queryParams.append('from_address', filters.fromAddress);
    if (filters.toAddress) queryParams.append('to_address', filters.toAddress);
    if (filters.minUsdValue) queryParams.append('min_usd_value', filters.minUsdValue);

    // Añadir active_watchers_only si es true
    if (activeWatchersOnly) {
      queryParams.append('active_watchers_only', 'true');
    }

    const url = `${API_BASE_URL}/events/?${queryParams.toString()}`;
    console.log("[useEvents] Fetching URL:", url);

    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      console.log("[useEvents] Response from fetchAllMyEvents:", {status: res.status, statusText: res.statusText, ok: res.ok});

      if (!res.ok) {
        await handleFetchError(res, `Failed to fetch all events`);
        return;
      }
      const data = await res.json();
      console.log("[useEvents] Data received from fetchAllMyEvents:", data);

      if (data && Array.isArray(data.events) && typeof data.total_events === 'number') {
        setEvents(data.events);
        setTotalEvents(data.total_events);
      } else {
        console.warn("[useEvents] Response from fetchAllMyEvents does not have the expected format. Data:", data);
        setEvents([]);
        setTotalEvents(0);
      }
    } catch (err: unknown) {
      console.error("[useEvents] Catch in fetchAllMyEvents:", err);
      let errorMessage = "An unexpected error occurred while fetching events.";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setError(errorMessage);
      setEvents([]);
      setTotalEvents(0);
    } finally {
      setIsLoading(false);
    }
  }, [token, handleFetchError]);

   const fetchEventsByWatcher = useCallback(async (watcherId: number) => {
    // ... (sin cambios en esta función por ahora)
    console.log(`[useEvents] Attempting fetchEventsByWatcher for watcherId: ${watcherId}. Current token:`, token);
    if (!token) {
      setError("Not authenticated to fetch events (token is null or empty in useEvents for fetchEventsByWatcher).");
      setEvents(currentEvents => currentEvents.length > 0 ? [] : currentEvents);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/events/watcher/${watcherId}/?skip=0&limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      console.log(`[useEvents] Response from fetchEventsByWatcher for watcherId ${watcherId}:`, res.status, res.statusText);

      if (!res.ok) {
        await handleFetchError(res, `Failed to fetch events for watcher ${watcherId}`);
        return;
      }
      const data = await res.json();
      console.log(`[useEvents] Data received from fetchEventsByWatcher for watcherId ${watcherId}:`, data);
      if (data && Array.isArray(data.events) && typeof data.total_events === 'number') {
        setEvents(data.events);
        setTotalEvents(data.total_events);
      } else {
        console.warn("[useEvents] Response from fetchEventsByWatcher does not have the expected format (PaginatedTokenEventResponse). Data:", data);
        setEvents([]);
        setTotalEvents(0);
      }
    } catch (err: unknown) {
      console.error("[useEvents] Catch in fetchEventsByWatcher:", err);
      let errorMessage = "An unexpected error occurred while fetching events for watcher.";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setError(errorMessage);
      setEvents([]);
      setTotalEvents(0);
    } finally {
      setIsLoading(false);
    }
  }, [token, handleFetchError]);


  return {
    events,
    totalEvents,
    isLoading,
    error,
    fetchEventsByWatcher,
    fetchAllMyEvents,
  };
}