// File: dashboard/tokenwatcher-app/src/app/dashboard/admin/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '@/components/common/ConfirmationModal'; // <-- 1. IMPORTAMOS EL NUEVO MODAL

// Definimos el tipo de usuario completo que esperamos de la API de admin
interface AdminUserView {
  id: number;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export default function AdminPage() {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 2. AÑADIMOS ESTADOS PARA CONTROLAR EL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUserView | null>(null);


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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users.');
      }
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


  // --- 3. MODIFICAMOS LA LÓGICA DE BORRADO ---

  // Esta función AHORA solo abre el modal
  const handleDeleteClick = (userForDeletion: AdminUserView) => {
    setUserToDelete(userForDeletion);
    setIsModalOpen(true);
  };
  
  // Esta es la función que se ejecutará al confirmar en el modal
  const handleConfirmDelete = async () => {
    if (!userToDelete || !token) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to delete user.');
      }
      // Actualizar la UI eliminando al usuario de la lista local
      setUsers(currentUsers => currentUsers.filter(u => u.id !== userToDelete.id));
      // No necesitamos un alert, el modal se cierra y la lista se actualiza.
    } catch (err: any) {
      // Podríamos mostrar un error más sofisticado si quisiéramos
      alert(`Error: ${err.message}`);
    }
  };


  // Si todavía está cargando la info de autenticación o el usuario no es admin, no mostrar nada
  if (isAuthLoading || !user?.is_admin) {
    return (
      <div className="text-center p-10">
        <p>Loading or unauthorized...</p>
      </div>
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
            <thead>
              <tr className="w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">ID</th>
                <th className="py-3 px-6 text-left">Email</th>
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
                  <td className="py-3 px-6 text-center">{u.is_active ? '✅' : '❌'}</td>
                  <td className="py-3 px-6 text-center">{u.is_admin ? '👑' : ''}</td>
                  <td className="py-3 px-6 text-left">{new Date(u.created_at).toLocaleString()}</td>
                  <td className="py-3 px-6 text-center">
                    <button
                      // --- 4. ACTUALIZAMOS EL ONCLICK DEL BOTÓN ---
                      onClick={() => handleDeleteClick(u)}
                      className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 disabled:bg-gray-400"
                      disabled={u.id === user.id}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- 5. AÑADIMOS EL COMPONENTE MODAL AL FINAL --- */}
      {userToDelete && (
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete User"
          confirmButtonText="Yes, Delete"
          confirmButtonVariant="danger"
        >
          <p>Are you sure you want to delete the user <span className="font-bold">{userToDelete.email}</span>?</p>
          <p className="mt-2">This action is irreversible and will delete all their associated watchers and events.</p>
        </ConfirmationModal>
      )}
    </div>
  );
}