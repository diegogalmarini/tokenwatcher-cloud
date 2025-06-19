// src/components/settings/ChangePasswordForm.tsx
"use client";

import React, { useState, FormEvent } from 'react';
import Button from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext'; // 1. Importamos el hook de autenticación

export default function ChangePasswordForm() {
  const { changePassword } = useAuth(); // 2. Obtenemos la función changePassword del contexto

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- 3. FUNCIÓN handleSubmit ACTUALIZADA ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsSaving(true);
    
    try {
      // Llamamos a la función del AuthContext que habla con la API
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      // Si la llamada tiene éxito...
      setSuccess("Password updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (err: any) {
      // Si la llamada falla, mostramos el error que nos devuelve la API
      setError(err.message || 'An unknown error occurred while updating the password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label
          htmlFor="current-password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Current Password
        </label>
        <input
          type="password"
          id="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#525252]"
          required
        />
      </div>
      <div>
        <label
          htmlFor="new-password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          New Password
        </label>
        <input
          type="password"
          id="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#525252]"
          required
        />
      </div>
      <div>
        <label
          htmlFor="confirm-password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Confirm New Password
        </label>
        <input
          type="password"
          id="confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#525252]"
          required
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-500">{success}</p>}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}