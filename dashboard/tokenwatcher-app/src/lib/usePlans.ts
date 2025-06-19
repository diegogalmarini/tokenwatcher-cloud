// src/lib/usePlans.ts
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface Plan {
  id: number;
  name: string;
  description: string | null;
  price_monthly: number;
  price_annually: number;
  watcher_limit: number;
  is_active: boolean;
  stripe_price_id_monthly: string | null;
  stripe_price_id_annually: string | null;
}

export type PlanCreatePayload = Omit<Plan, 'id'>;
export type PlanUpdatePayload = Partial<PlanCreatePayload>;

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function usePlans() {
  const { token } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/plans/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch plans.");
      const data: Plan[] = await res.json();
      setPlans(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching plans.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const createPlan = async (payload: PlanCreatePayload) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_URL}/admin/plans/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || "Failed to create plan.");
    }
    await fetchPlans(); // Refresh list after creating
  };

  const updatePlan = async (id: number, payload: PlanUpdatePayload) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_URL}/admin/plans/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || "Failed to update plan.");
    }
    await fetchPlans(); // Refresh list after updating
  };
  
  // Nota: La funcionalidad de borrar planes se puede añadir aquí si es necesario en el futuro.

  return { plans, isLoading, error, fetchPlans, createPlan, updatePlan };
}