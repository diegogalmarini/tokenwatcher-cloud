// File: src/components/auth/LogoutButton.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleClick = () => {
    // Llamo a la función que limpia estado y redirige a "/"
    logout();
  };

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
    >
      Logout
    </button>
  );
}
