import { CollectionTable } from "~/components/admin/collections/collection-table";
import type { Route } from "./+types/collections";

export const meta: Route.MetaFunction = () => [
  { title: "Collections — Griot and Grits Admin" },
];

export default function CollectionsPage() {
  return <CollectionTable />;
}
