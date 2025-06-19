"use client";

import React from 'react';
import { Plan } from '@/lib/usePlans';
import Button from '@/components/ui/button';

interface Props {
  plans: Plan[];
  onEdit: (plan: Plan) => void;
  onDelete: (planId: number) => void;
}

export default function PlansTable({ plans, onEdit, onDelete }: Props) {
  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 dark:bg-neutral-800/50 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No plans found. Click on "+ New Plan" to create the first one.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-neutral-700">
      <table className="w-full table-auto bg-white dark:bg-[#404040]">
        <thead className="bg-gray-50 dark:bg-neutral-800/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Watcher Limit</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monthly Price</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Annual Price</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
          {plans.map((plan) => (
            <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/40">
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="font-medium text-gray-900 dark:text-gray-100">{plan.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{plan.description}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{plan.watcher_limit}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatPrice(plan.price_monthly)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatPrice(plan.price_annually)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-center">
                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    plan.is_active 
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" 
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                }`}>
                  {plan.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                <Button intent="default" size="sm" onClick={() => onEdit(plan)}>Edit</Button>
                <Button
                  intent="destructive"
                  size="sm"
                  onClick={() => onDelete(plan.id)}
                  disabled={plan.name === 'Free'}
                  title={plan.name === 'Free' ? "The Free plan cannot be deleted" : "Delete plan"}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}