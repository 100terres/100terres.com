import { defineConfig } from "astro/config";

import { experimentalPostBuildOptimization } from "./toolchain/astro/experimental-post-build-optimization";

export default defineConfig({
  integrations: [experimentalPostBuildOptimization()],
  scopedStyleStrategy: "class",
  output: "static",
  security: {
    csp: false, // handled by experimentalPostBuildOptimization
  },
  vite: {
    build: {
      minify: true,
    },
  },
});
