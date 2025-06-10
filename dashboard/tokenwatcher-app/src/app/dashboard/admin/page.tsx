// File: dashboard/tokenwatcher-app/src/app/dashboard/admin/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '@/components/common/ConfirmationModal';

// Interfaz para el objeto de usuario que recibimos de la API de admin
interface AdminUserView {
  id: number;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  plan: string;
  watcher_count: number;
  watcher_limit: number;
}

// Interfaz para los datos que enviaremos para actualizar un usuario
interface UserUpdatePayload {
    watcher_limit?: number;
    is_active?: boolean;
}

export default function AdminPage() {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Estado refactorizado para manejar cualquier tipo de confirmación ---
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    variant: 'primary' as 'primary' | 'danger',
  });

  // Proteger la ruta: si el usuario no es admin, redirigirlo
  useEffect(() => {
    if (!isAuthLoading && !user?.is_admin) {
      router.push('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  // Función para obtener la lista de usuarios
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch users.');
      const data: AdminUserView[] = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Obtener los usuarios cuando el componente se monta (si es admin)
  useEffect(() => {
    if (user?.is_admin) {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  // --- NUEVA LÓGICA PARA MANEJAR MÚLTIPLES ACCIONES ---

  // Función genérica para actualizar un usuario (límite o estado)
  const handleUpdateUser = async (userId: number, payload: UserUpdatePayload) => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update user.');
      }
      // Refrescar la lista de usuarios para ver los cambios
      fetchUsers();
    } catch (err: any) {
      alert(`Error updating user: ${err.message}`);
    }
  };

  // Función para manejar el borrado
  const handleDeleteUser = async (userId: number) => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete user.');
      // Actualizar la UI eliminando al usuario de la lista local
      setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(`Error deleting user: ${err.message}`);
    }
  };

  // --- FUNCIONES PARA ABRIR EL MODAL SEGÚN LA ACCIÓN ---

  const openDeleteModal = (userToDelete: AdminUserView) => {
    setModalState({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete the user ${userToDelete.email}? This action is irreversible and will delete all their associated watchers and events.`,
      confirmText: 'Yes, Delete',
      variant: 'danger',
      onConfirm: () => handleDeleteUser(userToDelete.id),
    });
  };

  const openToggleActiveModal = (userToToggle: AdminUserView) => {
    const action = userToToggle.is_active ? 'pause' : 'activate';
    setModalState({
      isOpen: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} the user ${userToToggle.email}? They ${action === 'pause' ? 'will not be able to log in' : 'will be able to log in again'}.`,
      confirmText: `Yes, ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      variant: 'primary',
      onConfirm: () => handleUpdateUser(userToToggle.id, { is_active: !userToToggle.is_active }),
    });
  };

  const handleEditLimitClick = (userToEdit: AdminUserView) => {
    const newLimit = prompt(`Enter new watcher limit for ${userToEdit.email}:`, String(userToEdit.watcher_limit));
    if (newLimit !== null && !isNaN(parseInt(newLimit, 10))) {
        const limitAsNumber = parseInt(newLimit, 10);
        handleUpdateUser(userToEdit.id, { watcher_limit: limitAsNumber });
    } else if (newLimit !== null) {
        alert("Please enter a valid number.");
    }
  };


  if (isAuthLoading || !user?.is_admin) {
    return (
      <div className="text-center p-10"><p>Loading or unauthorized...</p></div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      {loading && <p>Loading users...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
            <thead className="w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm leading-normal">
              <tr>
                <th className="py-3 px-6 text-left">ID</th>
                <th className="py-3 px-6 text-left">Email</th>
                <th className="py-3 px-6 text-center">Plan</th>
                <th className="py-3 px-6 text-center">Usage</th>
                <th className="py-3 px-6 text-center">Active</th>
                <th className="py-3 px-6 text-center">Admin</th>
                <th className="py-3 px-6 text-left">Created At</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-900 dark:text-gray-100 text-sm font-light">
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{u.id}</td>
                  <td className="py-3 px-6 text-left">{u.email}</td>
                  <td className="py-3 px-6 text-center">{u.plan}</td>
                  <td className="py-3 px-6 text-center">{`${u.watcher_count} / ${u.watcher_limit}`}</td>
                  <td className="py-3 px-6 text-center">{u.is_active ? '✅' : '❌'}</td>
                  <td className="py-3 px-6 text-center">{u.is_admin ? '👑' : ''}</td>
                  <td className="py-3 px-6 text-left">{new Date(u.created_at).toLocaleString()}</td>
                  {/* --- NUEVOS BOTONES DE ACCIÓN --- */}
                  <td className="py-3 px-6 text-center whitespace-nowrap space-x-2">
                    <button onClick={() => handleEditLimitClick(u)} className="bg-gray-500 text-white py-1 px-3 rounded hover:bg-gray-600 disabled:bg-gray-400 text-xs" disabled={u.is_admin}>Edit Limit</button>
                    <button onClick={() => openToggleActiveModal(u)} className={`${u.is_active ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'} text-white py-1 px-3 rounded disabled:bg-gray-400 text-xs`} disabled={u.id === user.id}>{u.is_active ? 'Pause' : 'Activate'}</button>
                    <button onClick={() => openDeleteModal(u)} className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 disabled:bg-gray-400 text-xs" disabled={u.id === user.id}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        confirmButtonText={modalState.confirmText}
        confirmButtonVariant={modalState.variant}
      >
        <p>{modalState.message}</p>
      </ConfirmationModal>
    </div>
  );
}