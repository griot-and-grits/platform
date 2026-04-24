import { ArtifactDetail } from "~/components/admin/artifacts/artifact-detail";
import type { Route } from "./+types/artifact-detail";

export const meta: Route.MetaFunction = () => [
  { title: "Artifact Detail — Griot and Grits Admin" },
];

export default function ArtifactDetailPage({ params }: Route.ComponentProps) {
  return <ArtifactDetail artifactId={params.artifactId} />;
}
