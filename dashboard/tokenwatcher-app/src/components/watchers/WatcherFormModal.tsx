"use client";

import React, { useState, useEffect, FormEvent } from "react";
import Button from "@/components/ui/button";

type Props = {
  isOpen: boolean;
  initialData: {
    id: number;
    token_address: string;
    threshold: number;
    webhook_url: string | null;
  } | null;
  onClose: () => void;
  onSave: (data: {
    token_address: string;
    threshold: number;
    webhook_url: string | null;
  }) => Promise<void>;
};

export default function WatcherFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [tokenAddress, setTokenAddress] = useState("");
  const [threshold, setThreshold] = useState(0);
  const [webhookUrl, setWebhookUrl] = useState<string>("");

  useEffect(() => {
    if (initialData) {
      setTokenAddress(initialData.token_address);
      setThreshold(initialData.threshold);
      setWebhookUrl(initialData.webhook_url ?? "");
    } else {
      setTokenAddress("");
      setThreshold(0);
      setWebhookUrl("");
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSave({
      token_address: tokenAddress.trim(),
      threshold,
      webhook_url: webhookUrl.trim() || null,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">
          {initialData ? "Edit Watcher" : "New Watcher"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Token Address
            </label>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0x..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Threshold</label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={0}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/webhook"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              size="sm"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {initialData ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
