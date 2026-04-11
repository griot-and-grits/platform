'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import type { ReactNode } from 'react';
import { Menu, LogOut, Package, Upload, Box, Home } from 'lucide-react';
import { useState } from 'react';

import { ADMIN_DEV_MODE } from '@/lib/admin/config';
import { cn } from '@/lib/utils';

type AdminShellProps = {
    children: ReactNode;
};

type NavItem = {
    href: string;
    label: string;
    icon: ReactNode;
};

const navItems: NavItem[] = [
    {
        href: '/admin',
        label: 'Dashboard',
        icon: <Home className="h-4 w-4" />,
    },
    {
        href: '/admin/artifacts',
        label: 'Artifacts',
        icon: <Box className="h-4 w-4" />,
    },
    {
        href: '/admin/upload',
        label: 'Upload Artifact',
        icon: <Upload className="h-4 w-4" />,
    },
    {
        href: '/admin/collections',
        label: 'Collections',
        icon: <Package className="h-4 w-4" />,
    },
];

export function AdminShell({ children }: AdminShellProps) {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const devBypass = session?.devBypass || ADMIN_DEV_MODE;

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/' });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <header className="border-b border-slate-200 bg-white shadow-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            className="rounded-md border border-slate-200 p-2 text-slate-600 lg:hidden"
                            onClick={() => setMobileNavOpen((open) => !open)}
                            aria-label="Toggle navigation"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                Griot &amp; Grits Admin
                            </p>
                            <h1 className="text-lg font-bold text-slate-900">Digital Preservation</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {status === 'authenticated' && session?.user?.name && (
                            <span className="hidden text-sm text-slate-600 sm:inline-flex">
                                {session.user.name}
                            </span>
                        )}
                        {status === 'authenticated' ? (
                            <button
                                type="button"
                                onClick={handleSignOut}
                                className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign out
                            </button>
                        ) : (
                            <Link
                                href="/admin/sign-in"
                                className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                                Sign in
                            </Link>
                        )}
                    </div>
                </div>
                {devBypass && (
                    <div className="bg-amber-50 py-2">
                        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 text-sm font-medium text-amber-900 sm:px-6 lg:px-8">
                            Development mode – authentication is relaxed. Configure GitHub OAuth before production.
                        </div>
                    </div>
                )}
            </header>
            <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
                <aside
                    className={cn(
                        'fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white px-4 py-6 shadow-lg transition-transform lg:relative lg:translate-x-0',
                        mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                    )}
                >
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const isActive =
                                item.href === '/admin'
                                    ? pathname === '/admin'
                                    : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileNavOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                                        isActive
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                                    )}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>
                <main className="min-h-[70vh] flex-1 lg:ml-0">
                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
