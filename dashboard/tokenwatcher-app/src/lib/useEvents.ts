// dashboard/tokenwatcher-app/src/lib/useEvents.ts
import { useCallback, useState } from "react"; // Quitamos useEffect, ya no es necesario aquí
import { useAuth } from "@/contexts/AuthContext";
import type { EventFilters } from "@/components/events/EventFilterBar"; // <-- Importamos la interfaz

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

// Interfaz para los parámetros de fetching, incluyendo filtros y ordenación
export interface FetchEventsParams {
    filters: Partial<EventFilters>; // Hacemos los filtros parciales
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    skip?: number;
    limit?: number;
}


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function useEvents() {
  const { token, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [totalEvents, setTotalEvents] = useState<number>(0); // <-- Añadido para paginación futura
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
    setTotalEvents(0); // <-- Resetear total en error
  }, [logout]);


  // Modificamos fetchAllMyEvents para que acepte parámetros
  const fetchAllMyEvents = useCallback(async (params: FetchEventsParams) => {
    const { filters, sortBy = 'created_at', sortOrder = 'desc', skip = 0, limit = 100 } = params;

    console.log("[useEvents] Intentando fetchAllMyEvents con params:", params);
    if (!token) {
      setError("Not authenticated to fetch events.");
      setEvents([]);
      setTotalEvents(0);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    // Construir la URL con parámetros
    const queryParams = new URLSearchParams({
        skip: String(skip),
        limit: String(limit),
        sort_by: sortBy,
        sort_order: sortOrder,
    });

    // Añadir filtros solo si tienen valor
    if (filters.tokenAddress) queryParams.append('token_address', filters.tokenAddress);
    if (filters.startDate) queryParams.append('start_date', filters.startDate);
    if (filters.endDate) queryParams.append('end_date', filters.endDate);
    if (filters.fromAddress) queryParams.append('from_address', filters.fromAddress);
    if (filters.toAddress) queryParams.append('to_address', filters.toAddress);
    if (filters.minUsdValue) queryParams.append('min_usd_value', filters.minUsdValue);

    const url = `${API_BASE_URL}/events/?${queryParams.toString()}`;
    console.log("[useEvents] Fetching URL:", url); // DEBUG

    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      console.log("[useEvents] Respuesta de fetchAllMyEvents:", {status: res.status, statusText: res.statusText, ok: res.ok});

      if (!res.ok) {
        await handleFetchError(res, `Failed to fetch all events`);
        return;
      }
      const data = await res.json();
      console.log("[useEvents] Datos recibidos de fetchAllMyEvents:", data);

      if (data && Array.isArray(data.events) && typeof data.total_events === 'number') {
        setEvents(data.events);
        setTotalEvents(data.total_events); // <-- Guardamos el total
      } else {
        console.warn("[useEvents] La respuesta de fetchAllMyEvents no tiene el formato esperado. Data:", data);
        setEvents([]);
        setTotalEvents(0);
      }
    } catch (err: any) {
      console.error("[useEvents] Catch en fetchAllMyEvents:", err);
      setError(err.message || "An unexpected error occurred.");
      setEvents([]);
      setTotalEvents(0);
    } finally {
      setIsLoading(false);
    }
  }, [token, handleFetchError]);

  // fetchEventsByWatcher se mantiene igual por ahora, pero podría fusionarse o refactorizarse en el futuro.
   const fetchEventsByWatcher = useCallback(async (watcherId: number) => {
    console.log(`[useEvents] Intentando fetchEventsByWatcher para watcherId: ${watcherId}. Token actual:`, token); // DEBUG
    if (!token) {
      setError("Not authenticated to fetch events (token is null or empty in useEvents for fetchEventsByWatcher).");
      setEvents(currentEvents => currentEvents.length > 0 ? [] : currentEvents);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/events/watcher/${watcherId}/?skip=0&limit=100`, { // Añadido skip/limit por defecto
        headers: { 'Authorization': `Bearer ${token}` },
      });

      console.log(`[useEvents] Respuesta de fetchEventsByWatcher para watcherId ${watcherId}:`, res.status, res.statusText); // DEBUG

      if (!res.ok) {
        await handleFetchError(res, `Failed to fetch events for watcher ${watcherId}`);
        return;
      }
      const data = await res.json();
      console.log(`[useEvents] Datos recibidos de fetchEventsByWatcher para watcherId ${watcherId}:`, data); // DEBUG
      // La API ahora devuelve { total_events: number, events: Event[] }
      if (data && Array.isArray(data.events)) {
        setEvents(data.events);
        setTotalEvents(data.total_events); // <-- Guardamos el total
      } else {
        console.warn("[useEvents] La respuesta de fetchEventsByWatcher no tiene el formato esperado (PaginatedTokenEventResponse). Data:", data);
        setEvents([]);
        setTotalEvents(0);
      }
    } catch (err: any) {
      console.error("[useEvents] Catch en fetchEventsByWatcher:", err);
      setError(err.message || "An unexpected error occurred.");
      setEvents([]);
      setTotalEvents(0);
    } finally {
      setIsLoading(false);
    }
  }, [token, handleFetchError]);


  return {
    events,
    totalEvents, // <-- Devolvemos el total
    isLoading,
    error,
    fetchEventsByWatcher,
    fetchAllMyEvents, // <-- Ahora es la función principal a llamar
  };
}