// dashboard/tokenwatcher-app/src/lib/useEvents.ts
import { useCallback, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext"; // Para la autenticación

// Este tipo debe coincidir con schemas.TokenEventRead de tu backend FastAPI
export interface Event {
  id: number; // El ID único del evento (de la secuencia)
  watcher_id: number;
  token_address_observed: string;
  amount: number;
  transaction_hash: string;
  block_number: number;
  created_at: string;
  from_address: string; // <-- AÑADIDO
  to_address: string;   // <-- AÑADIDO
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function useEvents() {
  const { token, logout } = useAuth(); // Usar el token y logout del contexto
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchError = useCallback(async (response: Response, defaultErrorMessage: string) => {
    if (response.status === 401) {
      setError("Your session may have expired. Please login again.");
      logout(); // Desloguear si el token es inválido
    } else {
      try {
        const errorData = await response.json();
        setError(errorData.detail || defaultErrorMessage);
      } catch {
        setError(defaultErrorMessage);
      }
    }
    setEvents([]);
  }, [logout]);

  // Obtiene eventos para un watcher específico (sin cambios en la lógica)
  const fetchEventsByWatcher = useCallback(async (watcherId: number) => {
    if (!token) {
      setError("Not authenticated to fetch events.");
      setEvents([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/events/watcher/${watcherId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        await handleFetchError(res, `Failed to fetch events for watcher ${watcherId}, status: ${res.status}`);
        return;
      }
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("fetchEventsByWatcher error:", err);
      setError(err.message || "An unexpected error occurred.");
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, handleFetchError]);

  // Obtiene todos los eventos para los watchers del usuario autenticado (sin cambios en la lógica)
  const fetchAllMyEvents = useCallback(async () => {
    if (!token) {
      setError("Not authenticated to fetch events.");
      setEvents([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/events/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        await handleFetchError(res, `Failed to fetch all events, status: ${res.status}`);
        return;
      }
      const data = await res.json();
      // Aseguramos que data sea un array, incluso si la API devuelve algo inesperado
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("fetchAllMyEvents error:", err);
      setError(err.message || "An unexpected error occurred.");
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, handleFetchError]);

  return {
    events,
    isLoading,
    error,
    fetchEventsByWatcher,
    fetchAllMyEvents,
  };
}