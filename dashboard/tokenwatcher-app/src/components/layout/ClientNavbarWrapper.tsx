// dashboard/tokenwatcher-app/src/components/layout/ClientNavbarWrapper.tsx
"use client";

import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import { NavItem } from './Navbar';
import { usePathname } from 'next/navigation';

export default function ClientNavbarWrapper() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  const getNavItems = (): NavItem[] => {
    const defaultItems: NavItem[] = [
      { name: 'Home', href: '/', type: 'link' },
      { name: 'How It Works', href: '/how-it-works', type: 'link' },
      { name: 'Contact', href: '/contact', type: 'link' },
    ];

    if (isLoading) {
      return defaultItems;
    }

    if (user) {
      const dashboardItems: NavItem[] = [
        { name: 'Dashboard', href: '/dashboard', type: 'link', current: pathname === '/dashboard' },
        { name: 'Events', href: '/dashboard/events', type: 'link', current: pathname === '/dashboard/events' },
        { name: 'Billing', href: '/dashboard/billing', type: 'link', current: pathname === '/dashboard/billing' },
        { name: 'Settings', href: '/dashboard/settings', type: 'link', current: pathname === '/dashboard/settings' },
      ];
      if (user.is_admin) {
        dashboardItems.push({ name: 'Admin Panel', href: '/dashboard/admin', type: 'link', current: pathname.startsWith('/dashboard/admin') });
      }
      dashboardItems.push({ name: 'Logout', onClick: logout, type: 'button' });
      return dashboardItems;
    } else {
      return [
        ...defaultItems,
        { name: 'Login', href: '/login', type: 'link', isPrimary: false },
        { name: 'Register', href: '/register', type: 'link', isPrimary: true },
      ];
    }
  };

  return <Navbar navItems={getNavItems()} />;
}
