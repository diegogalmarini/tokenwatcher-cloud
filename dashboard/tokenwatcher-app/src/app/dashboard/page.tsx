// dashboard/tokenwatcher-app/src/app/dashboard/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WatcherList from "@/components/watchers/WatcherList";
import { EventList } from "@/components/events/EventList";
import { useAuth } from '@/contexts/AuthContext';
import LogoutButton from '@/components/auth/LogoutButton';
import { EventFilterBar, EventFilters } from '@/components/events/EventFilterBar';
import { useWatchers } from '@/lib/useWatchers';

// Esta es la interfaz EventFilters que usa la barra, ya la define EventFilterBar.tsx
// No necesitamos redefinirla aquí si la importamos o la barra la maneja internamente.
// Pero si draftFilters y appliedFilters son de este tipo, debe estar disponible.
// La importamos de EventFilterBar.

const initialFilters: EventFilters = {
  watcherId: '',
  tokenSymbol: '',
  fromAddress: '',
  toAddress: '',
  minUsdValue: '',
  maxUsdValue: '',
  startDate: '',
  endDate: '',
};

export interface SortOptions { // Este export puede quedarse si otras páginas necesitaran este tipo
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

const initialSortOptions: SortOptions = {
    sortBy: 'created_at',
    sortOrder: 'desc',
};

const PAGE_SIZE = 25;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function AuthenticatedDashboardContent() { // Renombrado para claridad
  const { isAuthenticated, isLoading: authIsLoading, user, token } = useAuth();
  const router = useRouter();

  const { watchers, fetchWatchers, isLoading: isLoadingWatchers } = useWatchers();
  const [distinctTokenSymbols, setDistinctTokenSymbols] = useState<string[]>([]);
  const [isLoadingTokenSymbols, setIsLoadingTokenSymbols] = useState(false);

  useEffect(() => {
    // Log para ver cuándo se monta este componente y el estado de autenticación
    console.log('[DashboardPage] AuthenticatedDashboardContent mounted/updated. AuthLoading:', authIsLoading, 'IsAuth:', isAuthenticated);
    if (!authIsLoading && !isAuthenticated) {
      console.log('[DashboardPage] Not authenticated, redirecting to /login');
      router.replace('/login');
    }
  }, [authIsLoading, isAuthenticated, router]);

  useEffect(() => {
    if (token && isAuthenticated) { // Solo cargar si hay token y está autenticado
      console.log('[DashboardPage] Token exists, fetching watchers.');
      fetchWatchers();
    }
  }, [fetchWatchers, token, isAuthenticated]); // Añadido isAuthenticated

  const fetchDistinctTokenSymbols = useCallback(async () => {
    if (!token || !isAuthenticated) return; // Solo si hay token y está autenticado
    console.log('[DashboardPage] Fetching distinct token symbols...');
    setIsLoadingTokenSymbols(true);
    try {
      const response = await fetch(`${API_BASE_URL}/events/distinct-token-symbols/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch token symbols');
      }
      const symbols: string[] = await response.json();
      setDistinctTokenSymbols(symbols);
      console.log('[DashboardPage] Distinct token symbols fetched:', symbols);
    } catch (error) {
      console.error("[DashboardPage] Error fetching distinct token symbols:", error);
      setDistinctTokenSymbols([]);
    } finally {
      setIsLoadingTokenSymbols(false);
    }
  }, [token, isAuthenticated]); // Añadido isAuthenticated

  useEffect(() => {
    fetchDistinctTokenSymbols();
  }, [fetchDistinctTokenSymbols]);


  const [draftFilters, setDraftFilters] = useState<EventFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<EventFilters>(initialFilters);
  const [sortOptions, setSortOptions] = useState<SortOptions>(initialSortOptions);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
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
    setShowActiveOnlyEvents(false);
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

  // El estado de carga principal para el contenido del dashboard
  const dashboardContentLoading = isLoadingWatchers || isLoadingTokenSymbols;

  if (authIsLoading) { // Si el contexto de Auth aún está cargando (ej. verificando token inicial)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-300 text-lg">Verifying authentication...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) { // Si después de cargar Auth, no está autenticado, el useEffect ya habrá redirigido
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-300 text-lg">Redirecting to login...</p>
      </div>
    );
  }

  // Si está autenticado, mostramos el contenido del dashboard
  return (
    <>
      <header className="max-w-full mx-auto mb-8">
         <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
              TokenWatcher Dashboard
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
          Manage your watchers and view recent on-chain events.
        </p>
      </header>
      <div className="max-w-full mx-auto space-y-12">
        <WatcherList />
        <div>
            {dashboardContentLoading && !isEventsLoading ? ( // Muestra un loader si watchers o symbols están cargando pero los eventos no
                 <div className="text-center py-4"><p>Loading dashboard components...</p></div>
            ) : (
                <EventFilterBar
                    filters={draftFilters}
                    onFilterChange={handleFilterChange}
                    onApplyFilters={handleApplyFilters}
                    onClearFilters={handleClearFilters}
                    isLoading={isEventsLoading || isLoadingTokenSymbols || isLoadingWatchers}
                    showActiveOnlyEvents={showActiveOnlyEvents}
                    onToggleShowActiveOnly={handleToggleShowActiveOnly}
                    userWatchers={watchers}
                    distinctTokenSymbols={distinctTokenSymbols}
                />
            )}
            <EventList
                appliedFilters={appliedFilters}
                sortOptions={sortOptions}
                onSortChange={handleSortChange}
                setIsLoading={setIsEventsLoading}
                currentPage={currentPage}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                showActiveOnlyEvents={showActiveOnlyEvents}
            />
        </div>
      </div>
    </>
  );
}

// Exportación correcta para una página en el App Router
export default function DashboardPage() {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);

  // Prevenir mismatch de hidratación si AuthProvider hace algo que solo ocurre en cliente
  if (!hasMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-300 text-lg">Initializing Dashboard...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <AuthenticatedDashboardContent />
    </main>
  );
}