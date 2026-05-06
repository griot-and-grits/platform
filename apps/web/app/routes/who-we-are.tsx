import Nav from "~/components/nav";
import WhoWeAre from "~/components/who-we-are";
import type { Route } from "./+types/who-we-are";

export const meta: Route.MetaFunction = () => [
  { title: "Who We Are — Griot and Grits" },
];

export default function WhoWeArePage() {
  return (
    <>
      <Nav />
      <WhoWeAre />
    </>
  );
}
