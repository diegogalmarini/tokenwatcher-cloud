// src/components/events/EventList.tsx
"use client";

import React, { useEffect } from "react"; // useEffect importado
import { useEvents } from "@/lib/useEvents";
import { EventTable } from "./EventTable";
// import Button from "@/components/ui/button"; // Cambiado a minúscula para coincidir con tu archivo de botón
import Button from "@components/ui/button"; // Usando tu componente Button
import { useAuth } from "@/contexts/AuthContext"; // Para saber si está autenticado

export function EventList() {
  const { token } = useAuth(); // Obtener token para disparar fetch
  const { 
    events, 
    isLoading, // Cambiado de 'loading' a 'isLoading' para consistencia
    error, 
    fetchAllMyEvents // Usaremos esta función
    // deleteEvent // Comentado por ahora
  } = useEvents();

  useEffect(() => {
    if (token) { // Solo hacer fetch si el usuario está logueado (hay token)
      fetchAllMyEvents();
    }
  }, [fetchAllMyEvents, token]); // Depender de token para re-fetch al loguear/desloguear

  // const handleDelete = async (eventToDelete: any) => { // 'any' es temporal
  //   if (confirm(`Delete event #${eventToDelete.id}? This action might be permanent depending on backend logic.`)) {
  //     // await deleteEvent(eventToDelete.id); // deleteEvent en el hook necesitaría implementación
  //     // fetchAllMyEvents(); 
  //     alert("Delete functionality for events is not fully implemented yet.");
  //   }
  // };

  if (isLoading) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-4">Loading recent events...</p>;
  }

  // No mostrar error si no hay token, ya que la página principal ya maneja el redirect a login
  // Solo mostrar error si hay token pero el fetch falló por otra razón.
  if (token && error) {
    return <p className="text-center text-red-600 dark:text-red-400 py-4">Error loading events: {error}</p>;
  }
  
  if (!token && !isLoading) { // Si no hay token y no está cargando, no mostrar nada o un mensaje para loguearse
      return <p className="text-center text-gray-500 dark:text-gray-400 py-4">Please log in to see events.</p>;
  }


  return (
    <div className="space-y-4 mt-12"> {/* Añadido margen superior */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recent Events</h2>
        <Button 
            intent="default" // o tu variante 'outline'
            onClick={fetchAllMyEvents} 
            disabled={isLoading || !token}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200"
        >
          {isLoading ? "Refreshing..." : "Refresh Events"}
        </Button>
      </div>
      <EventTable events={events} /* onDelete={handleDelete} // Comentado */ />
    </div>
  );
}