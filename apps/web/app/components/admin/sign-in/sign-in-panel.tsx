
import { Github } from "lucide-react";
import { useState } from "react";
import { getLoginURL } from "~/lib/auth";

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
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Admin Portal Sign In
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Access the digital preservation tools for Griot &amp; Grits.
        </p>

        {githubEnabled && (
          <a
            href={getLoginURL(callbackUrl)}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Github className="h-4 w-4" />
            Sign in with GitHub
          </a>
        )}

        {devBypassEnabled && (
          <a
            href={getLoginURL(callbackUrl)}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Use development access
          </a>
        )}

        {!githubEnabled && !devBypassEnabled && (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            No authentication providers configured. Update environment variables
            to enable admin access.
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
