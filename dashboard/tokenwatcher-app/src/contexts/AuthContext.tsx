// dashboard/tokenwatcher-app/src/contexts/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation'; // Usaremos el App Router de Next.js

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
  // register: (userData: any) => Promise<void>; // Añadiremos esto más tarde
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

// El NEXT_PUBLIC_API_URL debe estar definido en tu .env.local
// y apuntar a tu backend de FastAPI, ej: https://tokenwatcher-cloud.onrender.com
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Para verificar el token al cargar
  const router = useRouter();

  useEffect(() => {
    // Al cargar la aplicación, intentar cargar el token desde localStorage
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      fetchUserProfile(storedToken); // Obtener perfil del usuario si hay token
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async (currentToken: string) => {
    if (!currentToken) {
        setUser(null);
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/users/me`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
      });
      if (response.ok) {
        const userData: User = await response.json();
        setUser(userData);
      } else {
        // Token inválido o expirado
        console.error("Failed to fetch user profile, token might be invalid.");
        logout(); // Limpiar token si es inválido
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      logout(); // Limpiar en caso de error de red
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email_or_username: string, password_string: string) => {
    setIsLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email_or_username); // FastAPI OAuth2PasswordRequestForm espera 'username'
      formData.append('password', password_string);

      const response = await fetch(`${API_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (response.ok) {
        const data = await response.json();
        const new_token = data.access_token;
        setToken(new_token);
        localStorage.setItem('authToken', new_token);
        await fetchUserProfile(new_token); // Obtener datos del usuario después del login
        router.push('/'); // Redirigir al dashboard o página principal
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to login');
      }
    } catch (error) {
      console.error('Login error:', error);
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      throw error; // Re-lanzar para que el componente de UI lo maneje
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    router.push('/login'); // Redirigir a la página de login
  };

  const value = {
    token,
    user,
    isAuthenticated: !!token && !!user, // Considerar autenticado si hay token y usuario
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}