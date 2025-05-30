// dashboard/tokenwatcher-app/src/components/watchers/WatcherList.tsx
"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import WatcherFormModal from "./WatcherFormModal";
import WatcherTable from "./WatcherTable";
import { useWatchers, Watcher, WatcherCreatePayload, WatcherUpdatePayload } from "@/lib/useWatchers";
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
  const [formError, setFormError] = useState<string | null>(null);


  useEffect(() => {
    if (token) {
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
    name: string;
    token_address: string;
    threshold: number;
    webhook_url: string | null;
  }) => {
    setFormError(null);
    try {
      if (editing && editing.id) {
        const payload: WatcherUpdatePayload = { ...data };
        if (data.webhook_url === "") payload.webhook_url = null;
        await updateWatcher(editing.id, payload);
      } else {
        if (!data.webhook_url) {
          setFormError("Webhook URL is required for new watchers.");
          throw new Error("Webhook URL is required.");
        }
        const payload: WatcherCreatePayload = {
            name: data.name,
            token_address: data.token_address,
            threshold: data.threshold,
            webhook_url: data.webhook_url,
        };
        await createWatcher(payload);
      }
      fetchWatchers();
      setModalOpen(false);
    } catch (err: unknown) {
      console.error("Failed to save watcher:", err);
      if (err instanceof Error) {
        setFormError(err.message);
      } else if (typeof err === 'string') {
        setFormError(err);
      } else {
        setFormError("An unexpected error occurred while saving the watcher.");
      }
    }
  };

  const handleDeleteWatcher = async (watcherId: number) => {
    if (confirm(`Are you sure you want to delete watcher #${watcherId}?`)) {
      try {
        await deleteWatcher(watcherId);
        fetchWatchers();
      } catch (err: unknown) {
        console.error("Failed to delete watcher:", err);
        let message = "Error deleting watcher.";
        if (err instanceof Error) message = `Error deleting watcher: ${err.message}`;
        else if (typeof err === 'string') message = `Error deleting watcher: ${err}`;
        alert(message);
      }
    }
  };

  const handleToggleActive = async (watcher: Watcher) => {
    const newActiveState = !watcher.is_active;
    if (confirm(`Are you sure you want to ${newActiveState ? "activate" : "pause"} watcher "${watcher.name}"?`)) {
      try {
        await updateWatcher(watcher.id, { is_active: newActiveState });
        fetchWatchers();
      } catch (err: unknown) {
        console.error("Failed to toggle watcher active state:", err);
        let message = "Error updating watcher state.";
        if (err instanceof Error) message = `Error updating watcher state: ${err.message}`;
        else if (typeof err === 'string') message = `Error updating watcher state: ${err}`;
        alert(message);
      }
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
            intent="secondary" // <--- CAMBIADO A "secondary"
            size="md" // Puedes ajustar el tamaño si es necesario
            onClick={() => { fetchWatchers(); setFormError(null); }}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh list"}
          </Button>
        </div>
      </div>

      {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}

      <WatcherTable
        watchers={watchers}
        onEdit={openEditModal}
        onDelete={handleDeleteWatcher}
        onToggleActive={handleToggleActive}
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