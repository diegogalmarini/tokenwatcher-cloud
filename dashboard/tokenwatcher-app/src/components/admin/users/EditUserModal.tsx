"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import Button from '@/components/ui/button';
import { Plan } from '@/lib/usePlans';

interface AdminUserView {
  id: number;
  email: string;
  plan: string;
  watcher_limit: number;
}

interface UserUpdatePayload {
    watcher_limit?: number;
    plan?: string;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserView;
  plans: Plan[];
  onSave: (userId: number, data: UserUpdatePayload) => Promise<void>;
};

export default function EditUserModal({ isOpen, onClose, user, plans, onSave }: Props) {
  const [watcherLimit, setWatcherLimit] = useState<number | string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setWatcherLimit(user.watcher_limit);
      setSelectedPlan(user.plan);
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: UserUpdatePayload = {
        watcher_limit: Number(watcherLimit),
        plan: selectedPlan,
      };
      await onSave(user.id, payload);
      onClose();
    } catch (error) {
      console.error("Failed to update user", error);
      // Aquí se podría añadir un estado de error para el modal
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Edit User: {user.email}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="plan" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Plan
            </label>
            <select
              id="plan"
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="watcher-limit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Custom Watcher Limit
            </label>
            <input
              type="number"
              id="watcher-limit"
              value={watcherLimit}
              onChange={(e) => setWatcherLimit(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" intent="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" intent="default" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}