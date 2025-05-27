// src/components/events/EventList.tsx
"use client";

import React, { useEffect } from "react";
import { useEvents } from "@/lib/useEvents";
import { EventTable } from "./EventTable";
import Button from "@components/ui/button"; // Asumo que tienes este componente
import { useAuth } from "@/contexts/AuthContext";
import type { EventFilters } from "./EventFilterBar"; // Importamos tipos
import type { SortOptions } from "@/app/page"; // Importamos tipos

// Definimos las props que recibirá EventList
interface EventListProps {
    appliedFilters: EventFilters;
    sortOptions: SortOptions;
    onSortChange: (newSortBy: string) => void;
    setIsLoading: (loading: boolean) => void; // Para comunicar el estado de carga
}

export function EventList({ appliedFilters, sortOptions, onSortChange, setIsLoading }: EventListProps) {
  const { token } = useAuth();
  const {
    events,
    isLoading,
    error,
    fetchAllMyEvents
  } = useEvents();

  // useEffect para llamar a fetchAllMyEvents cuando cambien los filtros,
  // la ordenación o el token.
  useEffect(() => {
    if (token) {
      fetchAllMyEvents({
          filters: appliedFilters,
          sortBy: sortOptions.sortBy,
          sortOrder: sortOptions.sortOrder,
          skip: 0, // <-- Por ahora paginación fija, la añadiremos luego
          limit: 100
      });
    }
  }, [fetchAllMyEvents, token, appliedFilters, sortOptions]); // Dependencias clave

  // Informamos al padre sobre el estado de carga
  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading, setIsLoading]);

  // Función para forzar refresco (re-fetch con los mismos filtros)
  const handleRefresh = () => {
      if (token) {
          fetchAllMyEvents({
              filters: appliedFilters,
              sortBy: sortOptions.sortBy,
              sortOrder: sortOptions.sortOrder,
              skip: 0,
              limit: 100
          });
      }
  };


  if (isLoading && events.length === 0) { // Mostramos 'Loading' solo si no hay eventos previos
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        <p>Loading recent events...</p>
      </div>
    );
  }

  if (token && error) {
    return (
      <div className="text-center text-red-600 dark:text-red-400 py-4">
        <p>Error loading events: {error}</p>
      </div>
    );
  }

  if (!token && !isLoading) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        <p>Please log in to see events.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-8"> {/* Aumentado el margen superior */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recent Events</h2>
        <Button
            intent="default" // Asegúrate de que este intent exista o cámbialo
            onClick={handleRefresh} // Llama a handleRefresh
            disabled={isLoading || !token}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200"
        >
          {isLoading ? "Refreshing..." : "Refresh Events"}
        </Button>
      </div>
      {/* Pasamos sortOptions y onSortChange a EventTable */}
      <EventTable
          events={events}
          sortOptions={sortOptions}
          onSortChange={onSortChange}
      />
    </div>
  );
}