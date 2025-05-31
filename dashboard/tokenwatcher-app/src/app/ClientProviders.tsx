// src/app/ClientProviders.tsx
"use client";

import React, { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
