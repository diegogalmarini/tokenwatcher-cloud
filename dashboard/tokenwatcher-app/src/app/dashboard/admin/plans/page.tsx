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

  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    planId: null as number | null,
  });

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
    try {
        if (id) {
          await updatePlan(id, data as PlanUpdatePayload);
        } else {
          await createPlan(data as PlanCreatePayload);
        }
        handleCloseModal();
    } catch (err) {
        console.error("Failed to save plan", err);
        // El error se mostrará en el modal, que lo gestiona internamente
        throw err;
    }
  };
  
  const openDeleteConfirmation = (planId: number) => {
    setDeleteModalState({ isOpen: true, planId });
  };
  
  const closeDeleteConfirmation = () => {
    setDeleteModalState({ isOpen: false, planId: null });
  };

  const handleDeletePlan = async () => {
    if (!deleteModalState.planId) return;
    
    alert(`(WIP) Lógica para borrar el plan con ID: ${deleteModalState.planId}. La API no tiene endpoint de borrado aún.`);
    // Cuando el endpoint DELETE /admin/plans/{id} exista, se llamará aquí
    // await deletePlan(deleteModalState.planId);
    closeDeleteConfirmation();
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

      {isLoading && <p>Loading plans...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!isLoading && !error && (
        <PlansTable
          plans={plans}
          onEdit={handleOpenEditModal}
          onDelete={openDeleteConfirmation}
        />
      )}

      <PlanFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePlan}
        initialData={editingPlan}
      />
      
      <ConfirmationModal
        isOpen={deleteModalState.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={handleDeletePlan}
        title="Delete Plan"
        confirmButtonText="Yes, Delete"
        confirmButtonVariant="destructive"
      >
        <p>Are you sure you want to delete this plan? This action cannot be undone.</p>
      </ConfirmationModal>
    </div>
  );
}