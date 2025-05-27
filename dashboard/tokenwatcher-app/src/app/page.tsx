// src/app/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WatcherList from "@/components/watchers/WatcherList";
import { EventList } from "@/components/events/EventList";
import { useAuth } from '@/contexts/AuthContext';
import LogoutButton from '@/components/auth/LogoutButton';
import { EventFilterBar, EventFilters } from '@/components/events/EventFilterBar';

const initialFilters: EventFilters = {
  tokenAddress: '', startDate: '', endDate: '',
  fromAddress: '', toAddress: '', minUsdValue: '',
};

// Definimos el tipo para la ordenación
export interface SortOptions {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

const initialSortOptions: SortOptions = {
    sortBy: 'created_at',
    sortOrder: 'desc',
};

function AuthenticatedPageContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // --- ESTADO Y MANEJADORES ---
  const [draftFilters, setDraftFilters] = useState<EventFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<EventFilters>(initialFilters);
  const [sortOptions, setSortOptions] = useState<SortOptions>(initialSortOptions);
  // El isLoading ahora lo manejaremos dentro de useEvents/EventList,
  // pero podemos tener uno aquí si necesitamos deshabilitar la barra.
  const [isEventsLoading, setIsEventsLoading] = useState(false); // Mantenemos uno básico

  // Cambia los filtros en borrador (en la barra)
  const handleFilterChange = useCallback((field: keyof EventFilters, value: string) => {
    setDraftFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  // Aplica los filtros (pasa de borrador a aplicados)
  const handleApplyFilters = useCallback(() => {
    console.log("Aplicando filtros:", draftFilters);
    setAppliedFilters(draftFilters);
    // La recarga se activará en EventList al cambiar appliedFilters
  }, [draftFilters]);

  // Limpia los filtros (borrador y aplicados)
  const handleClearFilters = useCallback(() => {
    console.log("Limpiando filtros...");
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
    // La recarga se activará en EventList al cambiar appliedFilters
  }, []);

  // Cambia la ordenación
  const handleSortChange = useCallback((newSortBy: string) => {
      setSortOptions(prev => {
          // Si es la misma columna, invierte el orden; si no, ordena por la nueva desc.
          const newSortOrder = (prev.sortBy === newSortBy && prev.sortOrder === 'desc') ? 'asc' : 'desc';
          return { sortBy: newSortBy, sortOrder: newSortOrder };
      });
      // La recarga se activará en EventList al cambiar sortOptions
  }, []);
  // --- FIN ESTADO Y MANEJADORES ---

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // ... (código de isLoading e !isAuthenticated sin cambios) ...

    if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-300 text-lg">Loading application data...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-300 text-lg">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <>
      <header className="max-w-full mx-auto mb-8">
        {/* ... (código del header sin cambios) ... */}
         <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
              TokenWatcher
            </h1>
            {user && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {user.email}
              </p>
            )}
          </div>
          <LogoutButton />
        </div>
        <p className="mt-4 text-md md:text-lg text-gray-700 dark:text-gray-300">
          Create watchers, view recent events, and receive real-time alerts.
        </p>
      </header>
      <div className="max-w-full mx-auto space-y-12">
        <WatcherList />

        <div>
            <EventFilterBar
                filters={draftFilters} // La barra usa los filtros en borrador
                onFilterChange={handleFilterChange}
                onApplyFilters={handleApplyFilters}
                onClearFilters={handleClearFilters}
                isLoading={isEventsLoading}
            />
            <EventList
                appliedFilters={appliedFilters} // EventList usa los filtros aplicados
                sortOptions={sortOptions}       // Pasamos la ordenación
                onSortChange={handleSortChange} // Pasamos el manejador de ordenación
                setIsLoading={setIsEventsLoading} // Para que EventList controle el estado
            />
        </div>
      </div>
    </>
  );
}

// ... (HomePage sin cambios) ...
export default function HomePage() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-300 text-lg">Initializing application...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <AuthenticatedPageContent />
    </main>
  );
}