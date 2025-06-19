"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { usePlans, Plan, PlanCreatePayload, PlanUpdatePayload } from '@/lib/usePlans';
import Button from '@/components/ui/button';
import PlansTable from '@/components/admin/plans/PlansTable';
import PlanFormModal from '@/components/admin/plans/PlanFormModal';
import ConfirmationModal from '@/components/common/ConfirmationModal';

export default function AdminPlansPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  
  const { plans, isLoading, error, fetchPlans, createPlan, updatePlan } = usePlans();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Proteger la ruta
  useEffect(() => {
    if (!isAuthLoading && !user?.is_admin) {
      router.push('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  // Cargar los planes al montar el componente
  useEffect(() => {
    if (user?.is_admin) {
      fetchPlans();
    }
  }, [user, fetchPlans]);

  const handleOpenNewModal = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleSavePlan = async (data: PlanCreatePayload | PlanUpdatePayload, id?: number) => {
    if (id) {
      await updatePlan(id, data as PlanUpdatePayload);
    } else {
      await createPlan(data as PlanCreatePayload);
    }
  };

  const handleDeletePlan = (planId: number) => {
    // Lógica para el modal de confirmación de borrado
    alert(`(WIP) Lógica para borrar el plan con ID: ${planId}`);
    // Aquí abriríamos un ConfirmationModal y llamaríamos a una función deletePlan del hook
  };

  if (isAuthLoading || !user?.is_admin) {
    return <div className="text-center p-10"><p>Loading or unauthorized...</p></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Plan Management</h1>
        <Button intent="default" onClick={handleOpenNewModal}>
          + New Plan
        </Button>
      </div>

      {loading && <p>Loading plans...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!loading && !error && (
        <PlansTable
          plans={plans}
          onEdit={handleOpenEditModal}
          onDelete={handleDeletePlan}
        />
      )}

      <PlanFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePlan}
        initialData={editingPlan}
      />
    </div>
  );
}