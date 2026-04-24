import { createRequire } from "node:module";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

const require = createRequire(import.meta.url);
const { cloudflareDevProxy } = require("@react-router/dev/vite/cloudflare");

export default defineConfig({
  plugins: [cloudflareDevProxy(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  ssr: {
    resolve: {
      conditions: ["workerd", "browser"],
    },
  },
});
