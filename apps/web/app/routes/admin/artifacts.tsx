import { ArtifactTable } from "~/components/admin/artifacts/artifact-table";
import type { Route } from "./+types/artifacts";

export const meta: Route.MetaFunction = () => [
  { title: "Artifacts — Griot and Grits Admin" },
];

export default function ArtifactsPage() {
  return <ArtifactTable />;
}
