// dashboard/tokenwatcher-app/src/contexts/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Define la forma de los datos del usuario que esperas de tu API /auth/users/me
interface User {
  id: number;
  email: string;
  is_active: boolean;
  // created_at: string; // Puedes añadir más campos si los necesitas y tu API los devuelve
}

// Define la forma del contexto de autenticación
interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email_or_username: string, password_string: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para usar el AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Función interna para limpiar estado, SIN REDIRIGIR
  const clearAuthState = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    setIsLoading(false); // Asegurarnos de que no se quede cargando
  }, []);

  const fetchUserProfile = useCallback(async (currentToken: string) => {
    setIsLoading(true); // Siempre empieza cargando
    try {
      const response = await fetch(`${API_URL}/auth/users/me`, {
        headers: { 'Authorization': `Bearer ${currentToken}` },
      });
      if (response.ok) {
        const userData: User = await response.json();
        setUser(userData);
      } else {
        console.error("Failed to fetch user profile, token might be invalid.");
        clearAuthState(); // Limpia estado si hay error (401)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      clearAuthState(); // Limpia estado si hay error de red
    } finally {
      setIsLoading(false); // Termina de cargar
    }
  }, [clearAuthState]);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken); // Establece el token primero
      fetchUserProfile(storedToken); // Luego intenta fetch
    } else {
      setIsLoading(false); // Si no hay token, no hay nada que cargar
    }
  }, [fetchUserProfile]);


  const login = async (email_or_username: string, password_string: string) => {
    setIsLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email_or_username);
      formData.append('password', password_string);

      const response = await fetch(`${API_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (response.ok) {
        const data = await response.json();
        const new_token = data.access_token;
        localStorage.setItem('authToken', new_token); // Guarda primero
        setToken(new_token); // Establece el token
        await fetchUserProfile(new_token); // Busca perfil
        router.push('/'); // Redirige al dashboard (esto está bien para login)
      } else {
        const errorData = await response.json();
        clearAuthState(); // Limpia si el login falla
        throw new Error(errorData.detail || 'Failed to login');
      }
    } catch (error) {
      console.error('Login error:', error);
      clearAuthState();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Esta es la función que el botón de Logout llamará.
  // SOLO limpia el estado. NO redirige.
  const logout = () => {
    clearAuthState();
    // router.push('/login'); // <--- LÍNEA ELIMINADA / COMENTADA
  };

  const value = {
    token,
    user,
    isAuthenticated: !!token && !!user, // Autenticado si hay token Y usuario
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}