// dashboard/tokenwatcher-app/src/app/dashboard/admin/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import Button from '@/components/ui/button';
import { usePlans, Plan } from '@/lib/usePlans';
import EditUserModal from '@/components/admin/users/EditUserModal'; // Importamos el nuevo modal

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
    plan?: string;
}

export default function AdminPage() {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { plans, fetchPlans } = usePlans();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserView | null>(null);

  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    variant: 'primary' as 'primary' | 'danger',
  });

  // Proteger la ruta
  useEffect(() => {
    if (!isAuthLoading && !user?.is_admin) {
      router.push('/dashboard');
    }
  }, [user, isAuthLoading, router]);

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

  useEffect(() => {
    if (user?.is_admin) {
      fetchUsers();
      fetchPlans(); // También cargamos los planes para el modal
    }
  }, [user, fetchUsers, fetchPlans]);

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
      fetchUsers();
      setIsEditModalOpen(false); // Cierra el modal de edición al guardar
    } catch (err: any) {
      alert(`Error updating user: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete user.');
      setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(`Error deleting user: ${err.message}`);
    }
  };

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
  
  const openEditModal = (userToEdit: AdminUserView) => {
      setEditingUser(userToEdit);
      setIsEditModalOpen(true);
  };

  if (isAuthLoading || !user?.is_admin) {
    return <div className="text-center p-10"><p>Loading or unauthorized...</p></div>;
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
                  <td className="py-3 px-6 text-center whitespace-nowrap space-x-2">
                    <Button onClick={() => openEditModal(u)} intent="secondary" size="sm" disabled={u.is_admin}>Edit</Button>
                    <Button onClick={() => openDeleteModal(u)} intent="destructive" size="sm" disabled={u.id === user.id}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingUser && (
        <EditUserModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            user={editingUser}
            plans={plans}
            onSave={handleUpdateUser}
        />
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