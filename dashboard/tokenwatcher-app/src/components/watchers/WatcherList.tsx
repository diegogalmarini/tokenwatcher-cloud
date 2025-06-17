// dashboard/tokenwatcher-app/src/components/watchers/WatcherList.tsx
"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import WatcherFormModal, { WatcherFormData } from "./WatcherFormModal"; // Importamos el tipo desde el Modal
import WatcherTable from "./WatcherTable";
import { useWatchers, Watcher, WatcherUpdatePayload } from "@/lib/useWatchers";
import { useAuth } from "@/contexts/AuthContext";

export default function WatcherList() {
  const { token } = useAuth();
  const {
    watchers,
    isLoading,
    error,
    fetchWatchers,
    createWatcher,
    updateWatcher,
    deleteWatcher,
  } = useWatchers();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Watcher> | null>(null);

  useEffect(() => {
    if (token) {
      fetchWatchers();
    }
  }, [fetchWatchers, token]);

  const openNewModal = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (watcher: Watcher) => {
    setEditing(watcher);
    setModalOpen(true);
  };

  // === FUNCIÓN HANDLESAVEWATCHER MODIFICADA PARA EL NUEVO FORMATO ===
  const handleSaveWatcher = async (data: WatcherFormData) => {
    try {
      if (editing && editing.id) {
        // Al editar un Watcher, solo actualizamos sus propiedades principales.
        // La gestión de transportes se hará con sus propios endpoints en el futuro.
        const payload: WatcherUpdatePayload = {
            name: data.name,
            threshold: data.threshold,
        };
        await updateWatcher(editing.id, payload);
      } else {
        // Al crear un nuevo Watcher, pasamos el objeto de datos completo
        // que ya tiene el formato correcto (transport_type y transport_target).
        // La función `createWatcher` en el hook `useWatchers` deberá ser actualizada para manejar esto.
        await createWatcher(data);
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Failed to save watcher:", err);
      // El error se relanza para que el modal lo capture y muestre
      throw err;
    }
  };

  const handleDeleteWatcher = async (watcherId: number) => {
    try {
      await deleteWatcher(watcherId);
    } catch (err: unknown) {
      console.error("Failed to delete watcher:", err);
      alert("An error occurred while deleting the watcher.");
    }
  };

  const handleToggleActive = async (watcher: Watcher) => {
    const newActiveState = !watcher.is_active;
    try {
      await updateWatcher(watcher.id, { is_active: newActiveState });
    } catch (err: unknown) {
      console.error("Failed to toggle watcher active state:", err);
      alert("An error occurred while updating the watcher state.");
    }
  };

  if (isLoading && watchers.length === 0) {
      return <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading watchers...</p>;
  }
  
  if (error) {
      return <p className="text-center text-red-500 py-8">Error loading watchers: {error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Watchers</h2>
        <div className="space-x-2">
          <Button intent="default" onClick={openNewModal} className="bg-blue-600 hover:bg-blue-700 text-white">
            + New Watcher
          </Button>
          <Button
            intent="secondary"
            size="md"
            onClick={fetchWatchers}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh list"}
          </Button>
        </div>
      </div>

      <WatcherTable
        watchers={watchers}
        onEdit={openEditModal}
        onDelete={handleDeleteWatcher}
        onToggleActive={handleToggleActive}
      />

      <WatcherFormModal
        isOpen={modalOpen}
        initialData={editing}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveWatcher}
      />
    </div>
  );
}