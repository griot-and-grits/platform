'use client';

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type AdminAppProvidersProps = {
    children: ReactNode;
    session?: Session | null;
};

export function AdminAppProviders({ children, session }: AdminAppProvidersProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                    mutations: {
                        retry: 0,
                    },
                },
            }),
    );

    return (
        <SessionProvider session={session}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </SessionProvider>
    );
}
