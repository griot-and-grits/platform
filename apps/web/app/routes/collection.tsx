import { Suspense } from "react";
import Collections from "~/components/collections";
import Nav from "~/components/nav";
import { loadVideoMetadata, loadFilterMetadata } from "~/lib/load-metadata";
import { isFeatureEnabled } from "~/lib/feature-flags";
import type { Route } from "./+types/collection";

export function loader({ context }: Route.LoaderArgs) {
  const videoMetadata = loadVideoMetadata();
  const filterMetadata = loadFilterMetadata();
  const askTheGriotEnabled = isFeatureEnabled("askTheGriot", context.cloudflare.env);
  return {
    videos: videoMetadata.videos,
    filters: filterMetadata,
    askTheGriotEnabled,
  };
}

export const meta: Route.MetaFunction = () => [
  { title: "Collection — Griot and Grits" },
];

export default function CollectionPage({ loaderData }: Route.ComponentProps) {
  const { videos, filters, askTheGriotEnabled } = loaderData;

  return (
    <>
      <Nav />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            Loading...
          </div>
        }
      >
        <Collections
          videos={videos}
          filters={filters}
          askTheGriotEnabled={askTheGriotEnabled}
        />
      </Suspense>
    </>
  );
}
