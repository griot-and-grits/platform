import About, { CollectionCTA } from "~/components/about";
import ContactSection from "~/components/contact";
import GoFundMe from "~/components/gofundme";
import Hero from "~/components/hero";
import MediaCoverage from "~/components/media-coverage";
import Nav from "~/components/nav";
import Services from "~/components/services";
import Testimonials from "~/components/testimonials";
import Works from "~/components/works";
import { loadVideoMetadata } from "~/lib/load-metadata";
import { getGoFundMeConfig } from "~/lib/feature-flags";
import type { Route } from "./+types/home";

export function loader() {
  const videoMetadata = loadVideoMetadata();
  const goFundMeConfig = getGoFundMeConfig();
  return { videos: videoMetadata.videos, goFundMeConfig };
}

export const meta: Route.MetaFunction = () => [
  { title: "Griot and Grits — Preserving the African American Experience" },
];

export default function Home({ loaderData }: Route.ComponentProps) {
  const { videos, goFundMeConfig } = loaderData;

  return (
    <>
      <div id="home"></div>
      <Nav />
      <Hero />
      <CollectionCTA />
      <Works videos={videos} />
      <About />
      <Services />
      {goFundMeConfig.enabled && goFundMeConfig.campaignId && (
        <GoFundMe
          campaignId={goFundMeConfig.campaignId}
          useEmbedded={goFundMeConfig.useEmbedded}
          showTracker={goFundMeConfig.showTracker}
        />
      )}
      <MediaCoverage />
      <Testimonials />
      <ContactSection />
    </>
  );
}
