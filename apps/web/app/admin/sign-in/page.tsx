import { redirect } from 'next/navigation';

import { auth, devBypassEnabled, isGitHubConfigured } from '@/auth';
import { SignInPanel } from '@/components/admin/sign-in/sign-in-panel';

type SignInPageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function SignInPage({ searchParams }: SignInPageProps) {
    const session = await auth();
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const callbackUrlParam = resolvedSearchParams?.callbackUrl;
    const callbackUrl =
        typeof callbackUrlParam === 'string' && callbackUrlParam.startsWith('http')
            ? callbackUrlParam
            : '/admin';

    if (session) {
        redirect(callbackUrl);
    }

    return (
        <SignInPanel
            callbackUrl={callbackUrl}
            githubEnabled={isGitHubConfigured}
            devBypassEnabled={devBypassEnabled}
        />
    );
}
