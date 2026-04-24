import { redirect } from "react-router";
import { getSession, getLoginURL } from "~/lib/auth";
import type { Route } from "./+types/sign-in";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get("callbackUrl") || "/admin";

  if (session) {
    throw redirect(callbackUrl);
  }

  const githubEnabled = Boolean(process.env.GITHUB_CLIENT_ID);
  const devBypassEnabled =
    process.env.ADMIN_DEV_BYPASS === "true" || !githubEnabled;

  return { callbackUrl, githubEnabled, devBypassEnabled };
}

export const meta: Route.MetaFunction = () => [
  { title: "Sign In — Griot and Grits Admin" },
];

export default function SignInPage({ loaderData }: Route.ComponentProps) {
  const { callbackUrl, githubEnabled, devBypassEnabled } = loaderData;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            Admin Sign In
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to access the preservation portal
          </p>
        </div>

        {githubEnabled && (
          <a
            href={getLoginURL(callbackUrl)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Sign in with GitHub
          </a>
        )}

        {devBypassEnabled && (
          <form method="post" action={getLoginURL(callbackUrl)} className="space-y-3">
            <p className="text-center text-xs text-amber-600">
              Development mode — GitHub not configured
            </p>
            <a
              href={getLoginURL(callbackUrl)}
              className="flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Continue as Dev Admin
            </a>
          </form>
        )}
      </div>
    </div>
  );
}
