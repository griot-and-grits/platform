import { CollectionDraftFlow } from "~/components/admin/collections/collection-draft-flow";
import type { Route } from "./+types/collection-create";

export const meta: Route.MetaFunction = () => [
  { title: "Create Collection — Griot and Grits Admin" },
];

export default function CollectionCreatePage() {
  return <CollectionDraftFlow />;
}
