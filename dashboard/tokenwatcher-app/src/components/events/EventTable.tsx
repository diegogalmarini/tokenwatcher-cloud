// src/components/events/EventTable.tsx
"use client";

import React from "react";
import { Event } from "@/lib/useEvents";
import { Button } from "@components/ui/button";

interface Props {
  data: Event[];
  onDelete: (e: Event) => void;
}

export function EventTable({ data, onDelete }: Props) {
  return (
    <table className="min-w-full border">
      <thead>
        <tr className="bg-gray-100">
          <th className="px-4 py-2 text-left">ID</th>
          <th className="px-4 py-2 text-left">Token</th>
          <th className="px-4 py-2 text-left">Type</th>
          <th className="px-4 py-2 text-right">Amount</th>
          <th className="px-4 py-2 text-left">Block</th>
          <th className="px-4 py-2 text-left">Tx</th>
          <th className="px-4 py-2 text-left">At</th>
          <th className="px-4 py-2 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((e) => (
          <tr key={e.id} className="even:bg-gray-50">
            <td className="px-4 py-2">{e.id}</td>
            <td className="px-4 py-2">{e.token_address}</td>
            <td className="px-4 py-2">{e.event_type}</td>
            <td className="px-4 py-2 text-right">{e.amount}</td>
            <td className="px-4 py-2">{e.block_number}</td>
            <td className="px-4 py-2">
              <a
                href={`${process.env.NEXT_PUBLIC_ETHERSCAN_TX_URL}/${e.transaction_hash}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {e.transaction_hash.slice(0, 10)}…
              </a>
            </td>
            <td className="px-4 py-2">{new Date(e.created_at).toLocaleString()}</td>
            <td className="px-4 py-2 text-center">
              <Button intent="outline" size="sm" onClick={() => onDelete(e)}>
                Delete
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
