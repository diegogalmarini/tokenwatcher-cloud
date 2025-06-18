// src/app/dashboard/settings/page.tsx
"use client";

import React from "react";
import SettingsCard from "@/components/settings/SettingsCard";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";
import DeleteAccountCard from "@/components/settings/DeleteAccountCard";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        Account Settings
      </h1>

      {/* Tarjeta para Cambiar Contraseña */}
      <SettingsCard
        title="Change Password"
        description="Update your password here. It's a good practice to use a strong, unique password."
      >
        <ChangePasswordForm />
      </SettingsCard>

      {/* Tarjeta para Eliminar Cuenta */}
      <DeleteAccountCard />

    </div>
  );
}