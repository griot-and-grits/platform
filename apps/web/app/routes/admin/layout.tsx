import { Outlet, redirect } from "react-router";
import { AdminShell } from "~/components/admin/shell/admin-shell";
import { getSession } from "~/lib/auth";
import type { Route } from "./+types/layout";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);

  // Don't require auth for sign-in page.
  if (url.pathname === "/admin/sign-in") {
    return { session: null };
  }

  const session = await getSession(request, context.cloudflare.env);
  if (!session) {
    throw redirect(`/admin/sign-in?callbackUrl=${encodeURIComponent(url.pathname)}`);
  }

  return { session };
}

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  const { session } = loaderData;

  if (!session) {
    // Sign-in page renders without the shell.
    return <Outlet />;
  }

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
