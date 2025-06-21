// dashboard/tokenwatcher-app/src/app/dashboard/billing/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plan } from '@/lib/usePlans';
import Button from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '@/components/common/ConfirmationModal';

export default function BillingPage() {
    console.log("--- [BillingPage] Component Render ---");

    const { user, token, isLoading, refetchUser } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        isConfirming: boolean;
        title: string;
        message: string;
        planToChange?: Plan;
    }>({
        isOpen: false,
        isConfirming: false,
        title: '',
        message: '',
        planToChange: undefined,
    });

    const fetchActivePlans = useCallback(async () => {
        console.log("[fetchActivePlans] Starting to fetch active plans...");
        setLoadingPlans(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/plans/`);
            console.log("[fetchActivePlans] API response received:", response.status);
            if (!response.ok) throw new Error("Could not fetch available plans.");
            const data = await response.json();
            console.log("[fetchActivePlans] Plans data:", data);
            setPlans(data);
        } catch (err: any) {
            console.error("[fetchActivePlans] Error:", err);
            setError(err.message);
        } finally {
            console.log("[fetchActivePlans] Finished fetching.");
            setLoadingPlans(false);
        }
    }, []);

    useEffect(() => {
        console.log("[useEffect] Running effect to check user and fetch plans.");
        if (!isLoading && !user) {
            console.log("[useEffect] User not found, redirecting to login.");
            router.push('/login');
        }
        if (user) {
            console.log("[useEffect] User found, calling fetchActivePlans.");
            fetchActivePlans();
        }
    }, [user, isLoading, router, fetchActivePlans]);

    const openConfirmationModal = (plan: Plan) => {
        console.log("[openConfirmationModal] Opening modal for plan:", plan.name);
        setError(null);
        setModalState({
            isOpen: true,
            isConfirming: false,
            title: `Confirm Plan Change`,
            message: `Are you sure you want to change to the ${plan.name} plan?`,
            planToChange: plan,
        });
    };

    const handleConfirmPlanChange = async () => {
        console.log("--- [handleConfirmPlanChange] PROCESS START ---");
        if (!modalState.planToChange || !token || !user) {
            console.error("[handleConfirmPlanChange] Aborting: Missing data.", { plan: modalState.planToChange, token, user });
            return;
        }

        console.log("[handleConfirmPlanChange] 1. Setting state to isConfirming: true");
        setModalState(prev => ({ ...prev, isConfirming: true }));
        setError(null);

        try {
            console.log("[handleConfirmPlanChange] 2. Sending PATCH request to API for plan:", modalState.planToChange.id);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/plan`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_id: modalState.planToChange.id }),
            });
            console.log("[handleConfirmPlanChange] 3. API response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("[handleConfirmPlanChange] API Error:", errorData);
                throw new Error(errorData.detail || "Failed to update plan.");
            }
            
            console.log("[handleConfirmPlanChange] 4. API call successful. Calling refetchUser().");
            await refetchUser();
            console.log("[handleConfirmPlanChange] 5. refetchUser() completed.");
            
        } catch (err: any) {
            console.error("[handleConfirmPlanChange] 6. An error occurred in the try block:", err);
            setError(err.message);
        } finally {
            console.log("[handleConfirmPlanChange] 7. FINALLY block. Closing modal.");
            setModalState({ isOpen: false, isConfirming: false, title: '', message: '', planToChange: undefined });
            console.log("--- [handleConfirmPlanChange] PROCESS END ---");
        }
    };

    if (isLoading || loadingPlans || !user) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    const currentPlanDetails = plans.find(p => p.name === user.plan) || { price_monthly: 0, watcher_limit: user.watcher_limit };

    const PlanCard = ({ plan }: { plan: Plan }) => {
        const isCurrent = plan.name === user.plan;
        const isUpgrade = plan.price_monthly > currentPlanDetails.price_monthly;
        const buttonText = isCurrent ? "Current Plan" : (isUpgrade ? "Upgrade" : "Downgrade");

        return (
            <div className={`border rounded-lg p-6 flex flex-col ${isCurrent ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-neutral-700'}`}>
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1 h-10">{plan.description}</p>
                <p className="text-3xl font-bold my-4">${plan.price_monthly / 100}/mo</p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 flex-grow">
                    <li className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        {plan.watcher_limit} Watchers
                    </li>
                    <li className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        Email Alerts
                    </li>
                </ul>
                <Button 
                    className="w-full mt-6" 
                    intent={isCurrent ? "secondary" : (isUpgrade ? "default" : "secondary")}
                    disabled={isCurrent}
                    onClick={() => !isCurrent && openConfirmationModal(plan)}
                >
                    {buttonText}
                </Button>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Billing & Plan</h1>
            {error && <div className="p-3 my-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/50 dark:text-red-300" role="alert">{error}</div>}
            <div className="bg-white dark:bg-neutral-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
                 <h2 className="text-lg font-semibold mb-4">Current Subscription</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
                        <p className="font-semibold text-blue-600 dark:text-blue-400">{user.plan}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                        <p className={`font-semibold ${user.is_active ? 'text-green-600' : 'text-yellow-600'}`}>{user.is_active ? 'Active' : 'Paused'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Watcher Usage</p>
                        <p className="font-semibold">{`${user.watcher_count} / ${user.watcher_limit}`}</p>
                    </div>
                </div>
            </div>
            <div>
                <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {plans.map(plan => <PlanCard key={plan.id} plan={plan} />)}
                </div>
            </div>
            
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                onConfirm={handleConfirmPlanChange}
                isConfirming={modalState.isConfirming}
                title={modalState.title}
                confirmButtonText={modalState.isConfirming ? "Updating..." : "Confirm"}
                confirmButtonVariant="primary"
            >
                <p>{modalState.message}</p>
            </ConfirmationModal>
        </div>
    );
}
