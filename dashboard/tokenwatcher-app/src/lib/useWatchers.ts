// dashboard/tokenwatcher-app/src/lib/useWatchers.ts
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext"; // Importar useAuth para acceder al token

// Este tipo AHORA SÍ se alinea con schemas.WatcherRead de FastAPI
export type Watcher = {
  id: number;
  owner_id: number;
  name: string;
  token_address: string;
  threshold: number;
  is_active: boolean;
  webhook_url: string | null; // Proveniente del primer Transport asociado
  created_at: string; // O Date si prefieres convertirlo
  updated_at: string; // O Date
};

// Payload para crear un Watcher, alineado con schemas.WatcherCreate de FastAPI
export type WatcherCreatePayload = {
  name: string;
  token_address: string;
  threshold: number;
  webhook_url: string; // En FastAPI es HttpUrl, aquí lo manejamos como string del formulario
  is_active?: boolean; // Opcional en el payload, FastAPI schema tiene default True
};

// Payload para actualizar un Watcher, alineado con schemas.WatcherUpdate de FastAPI
export type WatcherUpdatePayload = {
  name?: string;
  token_address?: string;
  threshold?: number;
  webhook_url?: string | null; // string, HttpUrl o null
  is_active?: boolean;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function useWatchers() {
  const { token, logout } = useAuth(); // Obtener token y función de logout del AuthContext
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchers = useCallback(async () => {
    if (!token) {
      // No intentar fetch si no hay token (ej. usuario no logueado)
      // El AuthContext o la página deberían haber redirigido a login.
      // Si se llega aquí sin token, podría ser un estado transitorio o un error.
      setWatchers([]); // Limpiar watchers por si acaso
      // No establecer error aquí necesariamente, la protección de ruta es más arriba.
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
        if (res.status === 401) { // Unauthorized
          setError("Your session may have expired. Please login again.");
          logout(); // Desloguear al usuario si el token es inválido/expirado
        } else {
          const errorData = await res.json().catch(() => ({ detail: `Failed to fetch watchers, status: ${res.status}` }));
          setError(errorData.detail || `Failed to fetch watchers, status: ${res.status}`);
        }
        setWatchers([]); // Limpiar watchers en caso de error
        return;
      }
      const data: Watcher[] = await res.json();
      setWatchers(data);
    } catch (err: any) {
      console.error("fetchWatchers error:", err);
      setError(err.message || "An unexpected error occurred while fetching watchers.");
      setWatchers([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, logout]); // Añadido logout a dependencias

  const createWatcher = useCallback(async (payload: WatcherCreatePayload) => {
    if (!token) {
      setError("Not authenticated to create watcher.");
      throw new Error("Not authenticated");
    }
    setIsLoading(true); // Podríamos tener un isLoading específico para create
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
      // No es necesario parsear JSON aquí si la API devuelve 201 con el objeto creado,
      // pero fetchWatchers se encargará de actualizar la lista.
      await fetchWatchers(); // Re-fetch para obtener la lista actualizada con el nuevo ID, owner_id, etc.
    } catch (err: any) {
      console.error("createWatcher error:", err);
      setError(err.message); // Establecer error para que la UI pueda mostrarlo
      setIsLoading(false); // Asegurarse de resetear loading en error
      throw err; // Re-lanzar para que el formulario lo maneje si es necesario
    }
    // setIsLoading(false) se maneja en el finally de fetchWatchers
  }, [token, fetchWatchers]);

  const updateWatcher = useCallback(async (id: number, payload: WatcherUpdatePayload) => {
    if (!token) {
      setError("Not authenticated to update watcher.");
      throw new Error("Not authenticated");
    }
    setIsLoading(true); // Podríamos tener un isLoading específico para update
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
      await fetchWatchers(); // Re-fetch para obtener la lista actualizada
    } catch (err: any) {
      console.error("updateWatcher error:", err);
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [token, fetchWatchers]);

  const deleteWatcher = useCallback(async (id: number) => {
    if (!token) {
      setError("Not authenticated to delete watcher.");
      throw new Error("Not authenticated");
    }
    setIsLoading(true); // Podríamos tener un isLoading específico para delete
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/watchers/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      // DELETE exitoso usualmente es 204 No Content, o 200 OK con el objeto eliminado.
      // El endpoint de FastAPI está configurado para 204 No Content.
      if (!res.ok && res.status !== 204) { 
        const errorData = await res.json().catch(() => ({ detail: `Failed to delete watcher, status: ${res.status}` }));
        throw new Error(errorData.detail || `Server error: ${res.status}`);
      }
      await fetchWatchers(); // Re-fetch la lista después de borrar
    } catch (err: any) {
      console.error("deleteWatcher error:", err);
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [token, fetchWatchers]);

  // Efecto para cargar watchers cuando el token esté disponible (después del login)
  useEffect(() => {
    if (token) {
      fetchWatchers();
    } else {
      // Si no hay token (ej. después de logout), limpiar la lista de watchers
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