"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/button";
import WatcherFormModal from "./WatcherFormModal";
import { useWatchers, Watcher } from "@/lib/useWatchers";

export default function WatcherList() {
  const {
    watchers,
    fetchWatchers,
    createWatcher,
    updateWatcher,
    deleteWatcher,
  } = useWatchers();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Watcher | null>(null);

  useEffect(() => {
    fetchWatchers();
  }, []);

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (w: Watcher) => {
    setEditing(w);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-[90%]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Your Watchers</h2>
          <div className="space-x-2">
            <Button variant="primary" onClick={openNew}>
              + New Watcher
            </Button>
            <Button variant="outline" onClick={fetchWatchers}>
              Refresh list
            </Button>
          </div>
        </div>

        <table className="w-full table-auto bg-white rounded-lg shadow overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Token</th>
              <th className="px-4 py-2 text-left">Token Address</th>
              <th className="px-4 py-2 text-left">Threshold</th>
              <th className="px-4 py-2 text-left">Webhook URL</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {watchers.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No watchers yet.
                </td>
              </tr>
            )}
            {watchers.map((w) => {
              // TrustWallet logo URL
              const logoUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${w.token_address}/logo.png`;
              return (
                <tr key={w.id} className="border-t">
                  {/* Logo */}
                  <td className="px-4 py-2">
                    {/** Intentamos mostrar el logo */}
                    <Image
                      src={logoUrl}
                      width={24}
                      height={24}
                      alt="logo"
                      onError={(e) => {
                        // si da 404, ocultamos el <img>
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </td>
                  {/* Address */}
                  <td className="px-4 py-2 text-sm break-all">
                    {w.token_address}
                  </td>
                  {/* Threshold */}
                  <td className="px-4 py-2">{w.threshold}</td>
                  {/* Webhook: truncamos */}
                  <td className="px-4 py-2">
                    <a
                      href={w.webhook_url ?? "#"}
                      className="text-blue-600 hover:underline inline-block max-w-[200px] truncate"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {w.webhook_url}
                    </a>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-2 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(w)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteWatcher(w.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <WatcherFormModal
        isOpen={modalOpen}
        initialData={editing}
        onClose={() => setModalOpen(false)}
        onSave={async (data) => {
          if (editing) {
            await updateWatcher({ ...editing, ...data });
          } else {
            await createWatcher(data);
          }
          await fetchWatchers();
        }}
      />
    </div>
  );
}
