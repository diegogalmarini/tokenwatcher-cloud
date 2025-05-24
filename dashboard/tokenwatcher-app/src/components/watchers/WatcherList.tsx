// dashboard/tokenwatcher-app/src/components/watchers/WatcherList.tsx
"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button"; // Usando tu componente Button
import WatcherFormModal from "./WatcherFormModal";
import WatcherTable from "./WatcherTable"; // Importar la tabla actualizada
import { useWatchers, Watcher, WatcherCreatePayload, WatcherUpdatePayload } from "@/lib/useWatchers"; // Tipos de payload importados
import { useAuth } from "@/contexts/AuthContext"; // Para verificar autenticación

export default function WatcherList() {
  const { token } = useAuth(); // Para re-fetch cuando cambie el token (login/logout)
  const {
    watchers,
    isLoading, // Añadido de useWatchers
    error,     // Añadido de useWatchers
    fetchWatchers,
    createWatcher,
    updateWatcher,
    deleteWatcher,
  } = useWatchers();

  const [modalOpen, setModalOpen] = useState(false);
  // Ajustamos el tipo de 'editing' para que coincida con lo que espera WatcherFormModal
  const [editing, setEditing] = useState<Partial<Watcher> | null>(null); 
  const [formError, setFormError] = useState<string | null>(null);


  // Cargar watchers cuando el componente se monta o el token cambia
  useEffect(() => {
    if (token) { // Solo cargar si hay token
      fetchWatchers();
    }
  }, [fetchWatchers, token]);

  const openNewModal = () => {
    setEditing(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (watcher: Watcher) => {
    setEditing(watcher);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveWatcher = async (data: {
    name: string; // WatcherFormModal ahora envía 'name'
    token_address: string;
    threshold: number;
    webhook_url: string | null;
    // is_active?: boolean; // Si el modal lo manejara directamente
  }) => {
    setFormError(null);
    try {
      if (editing && editing.id) {
        // Para actualizar, construimos el payload de WatcherUpdatePayload
        const payload: WatcherUpdatePayload = { ...data };
        if (data.webhook_url === "") payload.webhook_url = null; // Asegurar que vacío sea null
        await updateWatcher(editing.id, payload);
      } else {
        // Para crear, construimos el payload de WatcherCreatePayload
        // webhook_url es obligatorio, WatcherFormModal debe asegurar que no sea null o vacío al crear.
        if (!data.webhook_url) {
          // Esto no debería ocurrir si el form es 'required' para webhook_url
          setFormError("Webhook URL is required for new watchers."); 
          throw new Error("Webhook URL is required.");
        }
        const payload: WatcherCreatePayload = {
            name: data.name,
            token_address: data.token_address,
            threshold: data.threshold,
            webhook_url: data.webhook_url, // Ya es string, no null
            // is_active se tomará por defecto en el backend o puede añadirse al payload si se controla en el form
        };
        await createWatcher(payload);
      }
      fetchWatchers(); // Re-fetch para asegurar consistencia y obtener todos los campos (ej. owner_id)
      setModalOpen(false); // Cerrar modal en éxito
    } catch (err: any) {
      console.error("Failed to save watcher:", err);
      setFormError(err.message || "An unexpected error occurred.");
      // No cerrar el modal en error para que el usuario vea el mensaje y pueda corregir
    }
  };

  const handleDeleteWatcher = async (watcherId: number) => {
    if (confirm(`Are you sure you want to delete watcher #${watcherId}?`)) {
      try {
        await deleteWatcher(watcherId);
        fetchWatchers(); // Re-fetch para actualizar la lista
      } catch (err: any) {
        console.error("Failed to delete watcher:", err);
        alert(`Error deleting watcher: ${err.message}`);
      }
    }
  };

  const handleToggleActive = async (watcher: Watcher) => {
    const newActiveState = !watcher.is_active;
    if (confirm(`Are you sure you want to ${newActiveState ? "activate" : "pause"} watcher "${watcher.name}"?`)) {
      try {
        await updateWatcher(watcher.id, { is_active: newActiveState });
        fetchWatchers(); // Re-fetch para actualizar la UI con el nuevo estado
      } catch (err: any) {
        console.error("Failed to toggle watcher active state:", err);
        alert(`Error updating watcher state: ${err.message}`);
      }
    }
  };

  if (isLoading && watchers.length === 0) { // Mostrar loading solo en la carga inicial
      return <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading watchers...</p>;
  }

  if (error) { // Mostrar error si la carga inicial falló
      return <p className="text-center text-red-500 py-8">Error loading watchers: {error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Watchers</h2>
        <div className="space-x-2">
          <Button intent="default" onClick={openNewModal} className="bg-blue-600 hover:bg-blue-700 text-white"> {/* Clase de ejemplo para botón primario */}
            + New Watcher
          </Button>
          <Button 
            intent="default" // O una variante 'outline' si la tienes
            onClick={() => { fetchWatchers(); setFormError(null); }} 
            disabled={isLoading}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200" // Clase de ejemplo
          >
            {isLoading ? "Refreshing..." : "Refresh list"}
          </Button>
        </div>
      </div>
      
      {/* Mostrar error del formulario si existe */}
      {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}

      <WatcherTable
        watchers={watchers}
        onEdit={openEditModal}
        onDelete={handleDeleteWatcher}
        onToggleActive={handleToggleActive} // Pasar la nueva función
      />

      <WatcherFormModal
        isOpen={modalOpen}
        initialData={editing}
        onClose={() => { setModalOpen(false); setFormError(null); }}
        onSave={handleSaveWatcher}
      />
    </div>
  );
}