export interface Env {
  ADMIN_AUTH_DISABLED?: string;
  ADMIN_DEV_BYPASS?: string;
  GITHUB_CLIENT_ID?: string;
  FEATURE_ASK_THE_GRIOT?: string;
  FEATURE_GOFUNDME?: string;
  GOFUNDME_CAMPAIGN_ID?: string;
  GOFUNDME_USE_EMBEDDED?: string;
  GOFUNDME_SHOW_TRACKER?: string;
}

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}
