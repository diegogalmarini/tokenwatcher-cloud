// dashboard/tokenwatcher-app/src/app/dashboard/billing/page.tsx
"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function BillingPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    if (isLoading) {
        return <div className="p-8 text-center">Loading your plan details...</div>;
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    const PlanCard = ({ title, description, price, features, isCurrent }: { title: string, description: string, price: string, features: string[], isCurrent: boolean }) => (
        <div className={`border rounded-lg p-6 ${isCurrent ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-neutral-700'}`}>
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            <p className="text-3xl font-bold my-4">{price}</p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        {feature}
                    </li>
                ))}
            </ul>
            <Button 
                className="w-full mt-6" 
                intent={isCurrent ? "secondary" : "default"}
                disabled={isCurrent}
            >
                {isCurrent ? "Current Plan" : "Upgrade"}
            </Button>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold mb-2">Billing & Plan</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Manage your subscription and view your current plan details.</p>

            <div className="bg-white dark:bg-neutral-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 mb-8">
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

            <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Choose a plan that best fits your needs. You can upgrade at any time.</p>
            
            {/* Hardcoded plans for display. In the future, this should come from the API */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <PlanCard 
                    title="Free"
                    description="For individuals just getting started."
                    price="$0/mo"
                    features={["3 Watchers", "Email Alerts", "Community Support"]}
                    isCurrent={user.plan === 'Free'}
                 />
                 <PlanCard 
                    title="Medium Watcher"
                    description="For serious enthusiasts and traders."
                    price="$10/mo"
                    features={["5 Watchers", "Advanced Alerts (Slack, Discord)", "Priority Support"]}
                    isCurrent={user.plan === 'Medium Watcher'}
                 />
                 <PlanCard 
                    title="Pro Watcher"
                    description="For power users and teams."
                    price="$25/mo"
                    features={["20 Watchers", "API Access", "Dedicated Support"]}
                    isCurrent={user.plan === 'Pro Watcher'}
                 />
            </div>
        </div>
    );
}
