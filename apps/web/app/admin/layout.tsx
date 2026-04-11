import type { ReactNode } from 'react';

import { auth } from '@/auth';
import { AdminAppProviders } from '@/components/admin/providers/app-providers';
import { AdminShell } from '@/components/admin/shell/admin-shell';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const session = await auth();

    // Don't render admin shell if not authenticated (sign-in page)
    if (!session) {
        return <AdminAppProviders session={session}>{children}</AdminAppProviders>;
    }

    return (
        <AdminAppProviders session={session}>
            <AdminShell>{children}</AdminShell>
        </AdminAppProviders>
    );
}
