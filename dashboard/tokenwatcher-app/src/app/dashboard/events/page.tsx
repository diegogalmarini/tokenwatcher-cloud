// src/app/dashboard/events/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEvents } from '@/lib/useEvents';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import Button from '@/components/ui/button';

// --- Componente de la Tabla de Eventos ---
// En un proyecto más grande, esto estaría en su propio archivo (components/events/EventTable.tsx)
function EventTable({ events, pagination, onPageChange }: any) {
    if (events.length === 0) {
        return <div className="text-center py-10 bg-white dark:bg-neutral-800/50 rounded-lg"><p>No events found for the selected filters.</p></div>;
    }

    return (
        <div className="overflow-x-auto bg-white dark:bg-neutral-800/50 rounded-lg shadow">
            <table className="w-full text-sm text-left">
                {/* ... (código de la tabla de eventos) ... */}
            </table>
        </div>
    );
}

// --- Componente de la Barra de Filtros ---
// En un proyecto más grande, esto estaría en su propio archivo (components/events/EventFilterBar.tsx)
function EventFilterBar({ filters, onFiltersChange, onApply }: any) {
    // ... (código de la barra de filtros) ...
    return <div className="p-4 bg-white dark:bg-neutral-800/50 rounded-lg shadow">Filtros aquí</div>;
}


export default function EventsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const { 
    events, 
    loading, 
    error, 
    filters, 
    setFilters, 
    pagination, 
    setPage,
    fetchEvents,
  } = useEvents();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  const handleApplyFilters = () => {
    fetchEvents();
  };

  if (isAuthLoading || !user) {
    return <div className="text-center p-10"><p>Loading...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Events History</h1>
        <Button onClick={() => fetchEvents(true)}>Refresh Events</Button>
      </div>
      
      <EventFilterBar filters={filters} onFiltersChange={setFilters} onApply={handleApplyFilters} />

      {loading && <p className="text-center py-10">Loading events...</p>}
      {error && <p className="text-center text-red-500 py-10">{error}</p>}
      
      {!loading && !error && (
        <EventTable 
          events={events} 
          pagination={pagination}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
