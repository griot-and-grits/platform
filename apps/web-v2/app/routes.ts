import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  // Public routes
  index("routes/home.tsx"),
  route("who-we-are", "routes/who-we-are.tsx"),
  route("collection", "routes/collection.tsx"),

  // Admin routes (with auth layout)
  layout("routes/admin/layout.tsx", [
    route("admin", "routes/admin/dashboard.tsx"),
    route("admin/sign-in", "routes/admin/sign-in.tsx"),
    route("admin/upload", "routes/admin/upload.tsx"),
    route("admin/artifacts", "routes/admin/artifacts.tsx"),
    route("admin/artifacts/:artifactId", "routes/admin/artifact-detail.tsx"),
    route("admin/collections", "routes/admin/collections.tsx"),
    route("admin/collections/create", "routes/admin/collection-create.tsx"),
  ]),
] satisfies RouteConfig;
