import { ArtifactUploadForm } from "~/components/admin/upload/artifact-upload-form";
import type { Route } from "./+types/upload";

export const meta: Route.MetaFunction = () => [
  { title: "Upload Artifact — Griot and Grits Admin" },
];

export default function UploadPage() {
  return <ArtifactUploadForm />;
}
