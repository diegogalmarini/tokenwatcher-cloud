// src/components/settings/DeleteAccountCard.tsx
"use client";

import React, { useState } from 'react';
import Button from '@/components/ui/button';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { useAuth } from '@/contexts/AuthContext';

export default function DeleteAccountCard() {
  const { deleteAccount } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setError(null);
    if (!password) {
      setError("Password is required to confirm deletion.");
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAccount({ password });
      // Si la llamada tiene éxito, el AuthProvider se encargará de redirigir.
      // No necesitamos hacer nada más aquí.
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setIsDeleting(false);
    } 
  };

  return (
    <>
      <section className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-300">Danger Zone</h2>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            Deleting your account is a permanent action and cannot be undone. This will immediately erase all your watchers and event history.
          </p>
          <div className="mt-4">
            <Button
              intent="destructive"
              onClick={() => setIsModalOpen(true)}
            >
              Delete My Account
            </Button>
          </div>
        </div>
      </section>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Confirm Account Deletion"
        confirmButtonText={isDeleting ? 'Deleting...' : 'Delete Account'}
        confirmButtonVariant="destructive"
        isConfirmDisabled={isDeleting}
      >
        <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
                This action is irreversible. To confirm, please enter your current password below.
            </p>
            <div>
                <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                    Password
                </label>
                <input
                    type="password"
                    id="confirm-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#525252]"
                    required
                />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </ConfirmationModal>
    </>
  );
}