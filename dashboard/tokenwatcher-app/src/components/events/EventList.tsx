// src/components/events/EventList.tsx
"use client";

import React, { useEffect } from "react";
import { useEvents } from "@/lib/useEvents";
import { EventTable } from "./EventTable";
import Button from "@components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { EventFilters } from "./EventFilterBar";
import type { SortOptions } from "@/app/page";
import { PaginationControls } from "@components/ui/PaginationControls";

interface EventListProps {
    appliedFilters: EventFilters;
    sortOptions: SortOptions;
    onSortChange: (newSortBy: string) => void;
    setIsLoading: (loading: boolean) => void;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export function EventList({
    appliedFilters,
    sortOptions,
    onSortChange,
    setIsLoading,
    currentPage,
    pageSize,
    onPageChange
}: EventListProps) {
  const { token } = useAuth();
  const {
    events,
    totalEvents,
    isLoading,
    error,
    fetchAllMyEvents
  } = useEvents();

  const totalPages = Math.ceil(totalEvents / pageSize);

  useEffect(() => {
    if (token) {
      const skip = (currentPage - 1) * pageSize;
      fetchAllMyEvents({
          filters: appliedFilters,
          sortBy: sortOptions.sortBy,
          sortOrder: sortOptions.sortOrder,
          skip: skip,
          limit: pageSize
      });
    }
  }, [fetchAllMyEvents, token, appliedFilters, sortOptions, currentPage, pageSize]);

  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading, setIsLoading]);

  const handleRefresh = () => {
      if (token) {
          const skip = (currentPage - 1) * pageSize;
          fetchAllMyEvents({
              filters: appliedFilters,
              sortBy: sortOptions.sortBy,
              sortOrder: sortOptions.sortOrder,
              skip: skip,
              limit: pageSize
          });
      }
  };

  if (isLoading && events.length === 0) {
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
    <div className="space-y-4 mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recent Events</h2>
        <Button
            intent="default"
            onClick={handleRefresh}
            disabled={isLoading || !token}
            // --- ESTILO DEL BOTÓN "Refresh Events" CON COLOR DE TEXTO CORREGIDO ---
            className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
        >
          {isLoading ? "Refreshing..." : "Refresh Events"}
        </Button>
      </div>
      <EventTable
          events={events}
          sortOptions={sortOptions}
          onSortChange={onSortChange}
      />
      <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          isLoading={isLoading}
      />
    </div>
  );
}