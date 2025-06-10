// File: src/contexts/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

// --- CAMBIO AQUÍ: AÑADIMOS is_admin ---
interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_admin: boolean; // <-- AÑADIDO
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Limpia estado de auth
  const clearAuthState = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
  }, []);

  // Trae perfil de usuario si el token es válido
  const fetchUserProfile = useCallback(
    async (currentToken: string) => {
      try {
        const response = await fetch(`${API_URL}/auth/users/me`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        if (response.ok) {
          const userData: User = await response.json();
          setUser(userData);
        } else {
          // Token inválido → limpio estado
          clearAuthState();
        }
      } catch (err) {
        clearAuthState();
      }
    },
    [clearAuthState]
  );

  // Al montar, inicializa estado desde localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      setToken(storedToken);
      fetchUserProfile(storedToken).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  // Función para hacer login
  const login = async (email_or_username: string, password_string: string) => {
    setIsLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email_or_username);
      formData.append("password", password_string);

      const response = await fetch(`${API_URL}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.access_token;
        if (!newToken) {
          throw new Error("No access_token received from server.");
        }
        localStorage.setItem("authToken", newToken);
        setToken(newToken);
        await fetchUserProfile(newToken);
        // Después de login exitoso, redirijo al Dashboard
        router.push("/dashboard");
      } else {
        const errorData = await response.json().catch(() => ({
          detail: "Invalid login response.",
        }));
        clearAuthState();
        throw new Error(
          (errorData as any).detail || "Failed to login. Check your credentials."
        );
      }
    } catch (err) {
      clearAuthState();
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para hacer logout
  const logout = () => {
    clearAuthState();
    setIsLoading(false);
    // Redirijo a la página principal ("/"), no a /login
    router.push("/");
  };

  const isAuthenticated = Boolean(token && user && user.is_active);

  const value: AuthContextType = {
    token,
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}