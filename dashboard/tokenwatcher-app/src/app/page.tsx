// src/app/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WatcherList from "@/components/watchers/WatcherList";
import { EventList } from "@/components/events/EventList";
import { useAuth } from '@/contexts/AuthContext';
import LogoutButton from '@/components/auth/LogoutButton';
// Importamos EventFilters y EventFilterBar desde su nueva ubicación
import { EventFilterBar, EventFilters } from '@/components/events/EventFilterBar';

// Actualizamos initialFilters para que coincida con la nueva interfaz EventFilters
const initialFilters: EventFilters = {
  watcherName: '',
  tokenSymbol: '',
  fromAddress: '',
  toAddress: '',
  minUsdValue: '',
  maxUsdValue: '', // Nuevo campo
  startDate: '',
  endDate: '',
};

export interface SortOptions {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

const initialSortOptions: SortOptions = {
    sortBy: 'created_at',
    sortOrder: 'desc',
};

const PAGE_SIZE = 25;

function AuthenticatedPageContent() {
  const { isAuthenticated, isLoading: authIsLoading, user } = useAuth(); // Renombrado isLoading a authIsLoading para claridad
  const router = useRouter();

  const [draftFilters, setDraftFilters] = useState<EventFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<EventFilters>(initialFilters);
  const [sortOptions, setSortOptions] = useState<SortOptions>(initialSortOptions);
  const [isEventsLoading, setIsEventsLoading] = useState(false); // Para la barra de filtros y la lista de eventos
  const [currentPage, setCurrentPage] = useState(1);
  const [showActiveOnlyEvents, setShowActiveOnlyEvents] = useState(false);

  const handleToggleShowActiveOnly = useCallback(() => {
    setShowActiveOnlyEvents(prev => !prev);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((field: keyof EventFilters, value: string) => {
    setDraftFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    setCurrentPage(1);
    setAppliedFilters(draftFilters);
  }, [draftFilters]);

  const handleClearFilters = useCallback(() => {
    setCurrentPage(1);
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
    // Opcional: si quieres que limpiar filtros también desactive "Show Active Only"
    // setShowActiveOnlyEvents(false);
  }, []);

  const handleSortChange = useCallback((newSortBy: string) => {
      setCurrentPage(1);
      setSortOptions(prev => {
          const newSortOrder = (prev.sortBy === newSortBy && prev.sortOrder === 'desc') ? 'asc' : 'desc';
          return { sortBy: newSortBy, sortOrder: newSortOrder };
      });
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
      setCurrentPage(newPage);
  }, []);

  useEffect(() => {
    if (!authIsLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authIsLoading, isAuthenticated, router]);

    if (authIsLoading) { // Usamos authIsLoading
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
                filters={draftFilters}
                onFilterChange={handleFilterChange}
                onApplyFilters={handleApplyFilters}
                onClearFilters={handleClearFilters}
                isLoading={isEventsLoading}
                showActiveOnlyEvents={showActiveOnlyEvents} // Prop para el botón de toggle
                onToggleShowActiveOnly={handleToggleShowActiveOnly} // Manejador para el botón de toggle
            />
            <EventList
                appliedFilters={appliedFilters}
                sortOptions={sortOptions}
                onSortChange={handleSortChange}
                setIsLoading={setIsEventsLoading} // EventList informará a page.tsx sobre su estado de carga
                currentPage={currentPage}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                showActiveOnlyEvents={showActiveOnlyEvents} // Pasar el estado a EventList para que useEvents lo use
            />
        </div>
      </div>
    </>
  );
}

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