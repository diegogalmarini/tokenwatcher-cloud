// src/components/events/EventList.tsx
"use client";

import React from "react";
import { useEvents } from "@/lib/useEvents";
import { EventTable } from "./EventTable";
import { Button } from "@components/ui/button";

export function EventList() {
  const { events, loading, error, fetchEvents, deleteEvent } = useEvents();

  const handleDelete = async (e: any) => {
    if (confirm(`Delete event #${e.id}?`)) {
      await deleteEvent(e.id);
      fetchEvents();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recent Events</h2>
        <Button intent="default" onClick={fetchEvents} disabled={loading}>
          Refresh
        </Button>
      </div>
      {error && <p className="text-red-600">Error loading events: {error}</p>}
      <EventTable data={events} onDelete={handleDelete} />
    </div>
  );
}
