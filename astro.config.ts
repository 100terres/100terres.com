import { defineConfig } from "astro/config";
import { experimentalPostBuildOptimization } from "./toolchain/astro/experimental-post-build-optimization";
import { I18N_DEFAULT_LOCALE, I18N_LOCALES } from "~/config";

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
  i18n: {
    locales: I18N_LOCALES,
    defaultLocale: I18N_DEFAULT_LOCALE,
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
