// src/components/watchers/WatcherTable.tsx
"use client"

import React from "react"
import { Watcher } from "@lib/useWatchers"
import Button from "@components/ui/button"

interface Props {
  data: Watcher[]
  onEdit: (w: Watcher) => void
  onDelete: (w: Watcher) => void
}

export default function WatcherTable({ data, onEdit, onDelete }: Props) {
  if (data.length === 0) {
    return <p>No watchers yet.</p>
  }
  return (
    <table className="min-w-full table-auto">
      <thead>
        <tr>
          <th>ID</th>
          <th>Token Address</th>
          <th>Threshold</th>
          <th>Webhook URL</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((w) => (
          <tr key={w.id}>
            <td>{w.id}</td>
            <td>{w.token_address}</td>
            <td>{w.threshold}</td>
            <td className="truncate max-w-xs">{w.webhook_url}</td>
            <td className="space-x-2">
              <Button onClick={() => onEdit(w)}>Edit</Button>
              <Button intent="destructive" onClick={() => onDelete(w)}>
                Delete
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
