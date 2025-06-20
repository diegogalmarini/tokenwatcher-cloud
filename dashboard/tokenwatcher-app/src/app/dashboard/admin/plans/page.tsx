// dashboard/tokenwatcher-app/src/app/dashboard/admin/plans/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/button';
import PlansTable from '@/components/admin/plans/PlansTable';
import PlanFormModal from '@/components/admin/plans/PlanFormModal';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { usePlans, Plan, PlanCreatePayload, PlanUpdatePayload } from '@/lib/usePlans';

function AdminTabs() {
    const pathname = usePathname();
    const tabs = [
        { name: 'User Management', href: '/dashboard/admin', current: pathname === '/dashboard/admin' },
        { name: 'Plan Management', href: '/dashboard/admin/plans', current: pathname === '/dashboard/admin/plans' },
    ];

    return (
        <div className="mb-6 border-b border-gray-200 dark:border-neutral-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                    <Link
                        key={tab.name}
                        href={tab.href}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            tab.current
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                        {tab.name}
                    </Link>
                ))}
            </nav>
        </div>
    );
}

export default function AdminPlansPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    const { plans, loading, error, fetchPlans, createPlan, updatePlan, deletePlan } = usePlans();
    
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);
    
    // Proteger la ruta
    useEffect(() => {
        if (!isAuthLoading && !user?.is_admin) {
            router.push('/dashboard');
        }
    }, [user, isAuthLoading, router]);

    useEffect(() => {
        if (user?.is_admin) {
            fetchPlans();
        }
    }, [user, fetchPlans]);
    
    const openPlanModal = (plan: Plan | null) => {
        setEditingPlan(plan);
        setIsPlanModalOpen(true);
    };

    const openDeleteModal = (planId: number) => {
        setDeletingPlanId(planId);
        setIsDeleteModalOpen(true);
    };
    
    const handleSavePlan = async (data: PlanCreatePayload | PlanUpdatePayload, id?: number) => {
        if (id) {
            await updatePlan(id, data as PlanUpdatePayload);
        } else {
            await createPlan(data as PlanCreatePayload);
        }
        fetchPlans(); // Re-fetch plans to show the latest data
    };
    
    const handleDeletePlan = async () => {
        if (deletingPlanId) {
            await deletePlan(deletingPlanId);
            setIsDeleteModalOpen(false);
            setDeletingPlanId(null);
            fetchPlans(); // Re-fetch plans
        }
    };

    if (isAuthLoading || !user?.is_admin) {
        return <div className="text-center p-10"><p>Loading or unauthorized...</p></div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
            <AdminTabs />

            <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Plan Management</h2>
                    <Button intent="default" onClick={() => openPlanModal(null)}>
                        + New Plan
                    </Button>
                </div>

                {loading && <p>Loading plans...</p>}
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md dark:bg-red-900/50">{error}</p>}
                
                {!loading && !error && (
                    <PlansTable plans={plans} onEdit={openPlanModal} onDelete={openDeleteModal} />
                )}
            </div>

            {isPlanModalOpen && (
                <PlanFormModal
                    isOpen={isPlanModalOpen}
                    onClose={() => setIsPlanModalOpen(false)}
                    onSave={handleSavePlan}
                    initialData={editingPlan}
                />
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeletePlan}
                title="Delete Plan"
                confirmButtonText="Yes, Delete"
                confirmButtonVariant="danger"
            >
                <p>Are you sure you want to delete this plan? This action cannot be undone.</p>
            </ConfirmationModal>
        </div>
    );
}
