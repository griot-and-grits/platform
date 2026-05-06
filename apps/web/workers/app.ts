import { createRequestHandler } from "react-router";
import type { Env } from "../app/lib/env";

const requestHandler = createRequestHandler(
  // @ts-expect-error virtual module provided by React Router at build time
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
