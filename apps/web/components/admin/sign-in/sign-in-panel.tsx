'use client';

import { Github } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

type SignInPanelProps = {
    callbackUrl: string;
    githubEnabled: boolean;
    devBypassEnabled: boolean;
};

export function SignInPanel({
    callbackUrl,
    githubEnabled,
    devBypassEnabled,
}: SignInPanelProps) {
    const [devToken, setDevToken] = useState('');
    const [message, setMessage] = useState<string | null>(null);

    const handleGitHubSignIn = async () => {
        await signIn('github', { callbackUrl });
    };

    const handleDevSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(null);

        const response = await signIn('dev-credentials', {
            token: devToken,
            callbackUrl,
            redirect: false,
        });

        if (response?.error) {
            setMessage('Invalid development token.');
            return;
        }

        if (response?.url) {
            window.location.href = response.url;
        } else {
            window.location.href = callbackUrl;
        }
    };

    return (
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
            <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-900">Admin Portal Sign In</h1>
                <p className="mt-2 text-sm text-slate-600">
                    Access the digital preservation tools for Griot &amp; Grits.
                </p>

                {githubEnabled && (
                    <button
                        type="button"
                        onClick={handleGitHubSignIn}
                        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        <Github className="h-4 w-4" />
                        Sign in with GitHub
                    </button>
                )}

                {devBypassEnabled && (
                    <form onSubmit={handleDevSignIn} className="mt-6 space-y-4">
                        <div>
                            <label
                                htmlFor="devToken"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Development Token
                            </label>
                            <input
                                id="devToken"
                                name="devToken"
                                value={devToken}
                                onChange={(event) => setDevToken(event.target.value)}
                                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                placeholder="Optional unless ADMIN_DEV_TOKEN is set"
                            />
                        </div>
                        <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                            Use development access
                        </button>
                    </form>
                )}

                {!githubEnabled && !devBypassEnabled && (
                    <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                        No authentication providers configured. Update environment variables to enable
                        admin access.
                    </p>
                )}

                {message && (
                    <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
