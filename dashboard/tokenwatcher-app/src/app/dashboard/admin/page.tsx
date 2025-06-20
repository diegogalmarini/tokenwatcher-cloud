"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import Button from '@/components/ui/button';
import { usePlans, Plan } from '@/lib/usePlans';
import EditUserModal from '@/components/admin/users/EditUserModal';

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

function AdminTabs() {
    const pathname = usePathname();
    const tabs = [
        { name: 'User Management', href: '/dashboard/admin', current: pathname === '/dashboard/admin' },
        { name: 'Plan Management', href: '/dashboard/admin/plans', current: pathname === '/dashboard/admin/plans' },
    ];

    return (
        <div className="mb-6 border-b border-gray-200 dark:border-neutral-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                <Link
                    key={tab.name}
                    href={tab.href}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        tab.current
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                    {tab.name}
                </Link>
                ))}
            </nav>
        </div>
    );
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
    setError(null); // Reset error on new fetch
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        // More descriptive error
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch users.' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
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
      await fetchUsers(); // Await fetch to ensure data is fresh
      setIsEditModalOpen(false); // Cierra el modal de edición al guardar
    } catch (err: any) {
      // Use a more user-friendly error display if possible
      setError(`Error updating user: ${err.message}`);
    }
  };

  const handleToggleUserStatus = async (userToUpdate: AdminUserView) => {
    const newStatus = !userToUpdate.is_active;
    const payload = { is_active: newStatus };
    await handleUpdateUser(userToUpdate.id, payload);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete user.');
      setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
    } catch (err: any) {
        setError(`Error deleting user: ${err.message}`);
    }
  };

  const openDeleteModal = (userToDelete: AdminUserView) => {
    setModalState({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete the user ${userToDelete.email}? This action is irreversible.`,
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
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
        <AdminTabs />

        <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            {loading && <p>Loading users...</p>}
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md dark:bg-red-900/50">{error}</p>}
            
            {!loading && !error && (
                <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
                    <thead className="w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm leading-normal">
                    <tr>
                        <th className="py-3 px-6 text-left">ID</th>
                        <th className="py-3 px-6 text-left">Email</th>
                        <th className="py-3 px-6 text-center">Plan</th>
                        <th className="py-3 px-6 text-center">Usage</th>
                        <th className="py-3 px-6 text-center">Status</th>
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
                        <td className="py-3 px-6 text-center">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                u.is_active 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                                {u.is_active ? 'Active' : 'Paused'}
                            </span>
                        </td>
                        <td className="py-3 px-6 text-center">{u.is_admin ? '👑' : ''}</td>
                        <td className="py-3 px-6 text-left">{new Date(u.created_at).toLocaleString()}</td>
                        <td className="py-3 px-6 text-center whitespace-nowrap space-x-2">
                            <Button onClick={() => openEditModal(u)} intent="secondary" size="sm" disabled={u.is_admin}>Edit</Button>
                            <Button 
                                onClick={() => handleToggleUserStatus(u)} 
                                intent={u.is_active ? "warning" : "success"} 
                                size="sm"
                                disabled={u.id === user.id || u.is_admin}
                                title={u.id === user.id || u.is_admin ? "Cannot change status of own admin account" : (u.is_active ? "Pause User" : "Unpause User")}
                            >
                                {u.is_active ? 'Pause' : 'Unpause'}
                            </Button>
                            <Button onClick={() => openDeleteModal(u)} intent="destructive" size="sm" disabled={u.id === user.id || u.is_admin}>Delete</Button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}
        </div>

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
            onConfirm={() => {
                modalState.onConfirm();
                setModalState({ ...modalState, isOpen: false });
            }}
            title={modalState.title}
            confirmButtonText={modalState.confirmText}
            confirmButtonVariant={modalState.variant}
        >
            <p>{modalState.message}</p>
        </ConfirmationModal>
    </div>
  );
}
