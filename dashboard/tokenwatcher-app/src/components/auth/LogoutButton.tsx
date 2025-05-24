// dashboard/tokenwatcher-app/src/components/auth/LogoutButton.tsx
"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/button'; // Usando tu componente Button

export default function LogoutButton() {
  const { logout, user } = useAuth();

  if (!user) return null; // No mostrar si no hay usuario (ya está deslogueado o cargando)

  return (
    <Button
      onClick={logout}
      intent="destructive" // O la variante que prefieras para logout
      size="md"
      className="ml-auto" // Para alinearlo si está en un flex container
    >
      Sign Out ({user.email})
    </Button>
  );
}