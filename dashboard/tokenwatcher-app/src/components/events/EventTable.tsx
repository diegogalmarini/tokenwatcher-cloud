// src/components/events/EventTable.tsx
"use client";

import React from "react";
import { Event } from "@/lib/useEvents"; // Tu tipo Event actualizado
// import Button from "@/components/ui/button"; // Cambiado a minúscula para coincidir con tu archivo de botón
import Button from "@components/ui/button"; // Usando tu componente Button

interface Props {
  events: Event[]; // Cambiado 'data' a 'events' para claridad
  // onDelete: (event: Event) => void; // Comentado por ahora, la función deleteEvent en el hook está comentada
}

// Asumimos que tienes una variable de entorno para la URL base de Etherscan
const ETHERSCAN_TX_URL = process.env.NEXT_PUBLIC_ETHERSCAN_TX_URL || "https://etherscan.io/tx";


export function EventTable({ events /*, onDelete */ }: Props) {
  if (!events || events.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-8">No events to display for the selected criteria.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <table className="min-w-full table-auto bg-white dark:bg-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Event ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Watcher ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Token Observed</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Block</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Transaction Hash</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Detected At (UTC)</th>
            {/* <th className="px-4 py-2 text-center">Actions</th> // Comentado porque onDelete está comentado */}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {events.map((event) => (
            <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{event.id}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{event.watcher_id}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs" title={event.token_address_observed}>
                {event.token_address_observed}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">{event.amount.toFixed(4)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{event.block_number}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm max-w-xs truncate" title={event.transaction_hash}>
                <a
                  href={`${ETHERSCAN_TX_URL}/${event.transaction_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {event.transaction_hash.slice(0, 10)}…{event.transaction_hash.slice(-8)}
                </a>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                {new Date(event.created_at).toLocaleString('sv-SE', { timeZone: 'UTC' })} {/* Formato más estándar y legible */}
              </td>
              {/* <td className="px-4 py-2 text-center">
                <Button intent="destructive" size="sm" onClick={() => onDelete(event)}>
                  Delete
                </Button>
              </td>
              */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}