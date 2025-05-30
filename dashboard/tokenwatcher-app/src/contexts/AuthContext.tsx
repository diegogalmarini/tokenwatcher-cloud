// dashboard/tokenwatcher-app/src/contexts/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  is_active: boolean;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email_or_username: string, password_string: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  console.log('[AuthContext] AuthProvider rendering...');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Inicia en true
  const router = useRouter();

  const clearAuthState = useCallback(() => {
    console.log('[AuthContext] clearAuthState called');
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  }, []);

  const fetchUserProfile = useCallback(async (currentToken: string) => {
    console.log('[AuthContext] fetchUserProfile called with token:', !!currentToken);
    // setIsLoading(true) aquí puede causar parpadeos si se llama a menudo.
    // El isLoading principal es manejado por el useEffect de carga inicial y la función login.
    try {
      const response = await fetch(`${API_URL}/auth/users/me`, {
        headers: { 'Authorization': `Bearer ${currentToken}` },
      });
      console.log('[AuthContext] fetchUserProfile response status:', response.status);
      if (response.ok) {
        const userData: User = await response.json();
        console.log('[AuthContext] fetchUserProfile success, user data:', userData);
        setUser(userData);
      } else {
        console.error("[AuthContext] Failed to fetch user profile, token might be invalid. Status:", response.status);
        clearAuthState();
        // setIsLoading(false) se maneja en el llamador de fetchUserProfile o en el useEffect principal
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching user profile:', error);
      clearAuthState();
      // setIsLoading(false) se maneja en el llamador de fetchUserProfile o en el useEffect principal
    }
  }, [clearAuthState]); // API_URL es constante de entorno, no necesita ser dependencia si no cambia en runtime

  useEffect(() => {
    console.log('[AuthContext] Initializing auth state from localStorage...');
    const storedToken = localStorage.getItem('authToken');
    console.log('[AuthContext] Stored token found:', storedToken);
    if (storedToken) {
      setToken(storedToken);
      // Llamamos a fetchUserProfile y el setIsLoading(false) se hará en su .finally()
      fetchUserProfile(storedToken).finally(() => {
        console.log('[AuthContext] Initial auth check (with token) finished.');
        setIsLoading(false);
      });
    } else {
      console.log('[AuthContext] No stored token found, finishing initial load.');
      setIsLoading(false);
    }
  }, [fetchUserProfile]); // fetchUserProfile es un useCallback, sus dependencias son estables


  const login = async (email_or_username: string, password_string: string) => {
    console.log('[AuthContext] login attempt for:', email_or_username);
    setIsLoading(true);
    // setError(null); // Asumimos que el error se maneja en la página de login
    try {
      const formData = new URLSearchParams();
      formData.append('username', email_or_username);
      formData.append('password', password_string);

      const response = await fetch(`${API_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      console.log('[AuthContext] login API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        const new_token = data.access_token;
        if (!new_token) {
            console.error('[AuthContext] No access_token in login response:', data);
            throw new Error("No access_token received from server.");
        }
        console.log('[AuthContext] Login successful, token received.');
        localStorage.setItem('authToken', new_token);
        setToken(new_token);
        await fetchUserProfile(new_token); // Esperar a que el perfil se cargue
        console.log('[AuthContext] User profile fetched after login. Redirecting to /dashboard.');
        router.push('/dashboard'); // Redirige al dashboard
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Login request failed and error response was not valid JSON.' }));
        console.error('[AuthContext] Login API errorData:', errorData);
        clearAuthState();
        throw new Error(errorData.detail || 'Failed to login. Please check your credentials.');
      }
    } catch (error) {
      console.error('[AuthContext] Login error catch block:', error);
      clearAuthState();
      throw error;
    } finally {
      // Este setIsLoading(false) se ejecutará incluso si hay una redirección,
      // lo cual está bien, pero el componente de login se desmontará.
      console.log('[AuthContext] Login function finished, setting isLoading to false.');
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('[AuthContext] logout called');
    clearAuthState();
    // setIsLoading(false) no es estrictamente necesario aquí si clearAuthState ya lo hace indirectamente
    // o si la redirección desmonta componentes que dependen de isLoading. Pero por seguridad:
    setIsLoading(false);
    router.push('/login');
  };

  const isAuthenticatedValue = !!token && !!user && !!user.is_active;
  console.log('[AuthContext] Recalculating value: token:', !!token, 'user:', !!user, 'isActive:', user?.is_active, 'isAuthenticated:', isAuthenticatedValue, 'isLoading:', isLoading);

  const value = {
    token,
    user,
    isAuthenticated: isAuthenticatedValue,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}