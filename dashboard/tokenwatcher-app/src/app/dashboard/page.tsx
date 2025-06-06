// src/app/dashboard/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import WatcherList from "@/components/watchers/WatcherList";
import { EventList } from "@/components/events/EventList";
import { useAuth } from "@/contexts/AuthContext";
import { EventFilterBar, EventFilters } from "@/components/events/EventFilterBar";
import { useWatchers } from "@/lib/useWatchers";

const initialFilters: EventFilters = {
  watcherId: "",
  tokenSymbol: "",
  fromAddress: "",
  toAddress: "",
  minUsdValue: "",
  maxUsdValue: "",
  startDate: "",
  endDate: "",
};

export interface SortOptions {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const initialSortOptions: SortOptions = {
  sortBy: "created_at",
  sortOrder: "desc",
};

const PAGE_SIZE = 25;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

function AuthenticatedDashboardContent() {
  const { isAuthenticated, isLoading: authIsLoading, user, token } = useAuth();
  const router = useRouter();

  const { watchers, fetchWatchers, isLoading: isLoadingWatchers } = useWatchers();
  const [distinctTokenSymbols, setDistinctTokenSymbols] = useState<string[]>([]);
  const [isLoadingTokenSymbols, setIsLoadingTokenSymbols] = useState(false);

  // Si no está autenticado, redirigir a la Home ("/").
  useEffect(() => {
    if (!authIsLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [authIsLoading, isAuthenticated, router]);

  // Cuando tenemos token & isAuthenticated, traemos la lista de watchers.
  useEffect(() => {
    if (token && isAuthenticated) {
      fetchWatchers();
    }
  }, [fetchWatchers, token, isAuthenticated]);

  // Obtener símbolos distintos para filtro de eventos.
  const fetchDistinctTokenSymbols = useCallback(async () => {
    if (!token || !isAuthenticated) return;
    setIsLoadingTokenSymbols(true);
    try {
      const response = await fetch(`${API_BASE_URL}/events/distinct-token-symbols/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch token symbols");
      }
      const symbols: string[] = await response.json();
      setDistinctTokenSymbols(symbols);
    } catch (error) {
      console.error("Error fetching distinct token symbols:", error);
      setDistinctTokenSymbols([]);
    } finally {
      setIsLoadingTokenSymbols(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    fetchDistinctTokenSymbols();
  }, [fetchDistinctTokenSymbols]);

  // Estados y handlers para filtros/sorting/paginación de eventos.
  const [draftFilters, setDraftFilters] = useState<EventFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<EventFilters>(initialFilters);
  const [sortOptions, setSortOptions] = useState<SortOptions>(initialSortOptions);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showActiveOnlyEvents, setShowActiveOnlyEvents] = useState(false);

  const handleToggleShowActiveOnly = useCallback(() => {
    setShowActiveOnlyEvents((prev) => !prev);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback(
    (field: keyof EventFilters, value: string) => {
      setDraftFilters((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

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
    setSortOptions((prev) => {
      const newSortOrder =
        prev.sortBy === newSortBy && prev.sortOrder === "desc" ? "asc" : "desc";
      return { sortBy: newSortBy, sortOrder: newSortOrder };
    });
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const dashboardContentLoading = isLoadingWatchers || isLoadingTokenSymbols;

  // Mientras verificamos autenticación…
  if (authIsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background dark:bg-background">
        <p className="text-muted-text text-lg">Verifying authentication...</p>
      </div>
    );
  }

  // Si no está autenticado, lo llevamos a Home ("/")
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background dark:bg-background">
        <p className="text-muted-text text-lg">Redirecting to home...</p>
      </div>
    );
  }

  // Usuario autenticado: mostramos el dashboard
  return (
    <div className="min-h-screen bg-background dark:bg-[#121212]">
      {/* 
        He cambiado aquí “max-w-7xl mx-auto px-6 py-8” 
        por “w-full px-6 py-8” para que ocupe todo el ancho disponible.
        Si quisieras un poco de margenes a los lados, puedes usar “px-4 lg:px-6” 
        o “mx-auto” sin el max-w-7xl:
          Ejemplo: <div className="w-full mx-auto px-6 py-8">
      */}
      <div className="w-full px-6 py-8">
        {/* El header “Your Watchers + saludo + Logout” está separado en DashboardHeader.tsx */}
        
        {/* ► Listado de Watchers */}
        <section className="mb-6">
          <WatcherList />
        </section>

        {/* ► Filtros y listado de eventos */}
        <section>
          {dashboardContentLoading && !isEventsLoading ? (
            <div className="text-center py-4 text-muted-text">
              Loading dashboard components...
            </div>
          ) : (
            <>
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
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <AuthenticatedDashboardContent />;
}
