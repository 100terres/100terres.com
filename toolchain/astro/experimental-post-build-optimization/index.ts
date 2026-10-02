import type { AstroIntegration } from "astro";
import {
  writeFileSync,
  unlinkSync,
  rmdirSync,
  readdirSync,
  readFileSync,
} from "fs";
import { join } from "path";
import { htmlFiles, loadHtml } from "./utils";
import { applyInlineImages } from "./inline-images";
import { applyDeadCss } from "./dead-css";
import { applyRenameCssVars } from "./rename-css-vars";
import { applyRenameCssClasses } from "./rename-css-classes";
import { applyMinifier } from "./html-minifier";

export function experimentalPostBuildOptimization(): AstroIntegration {
  return {
    name: "build-optimization",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const { distDir, files } = htmlFiles(dir);
        const inlinedFiles = new Set<string>();

        for (const file of files) {
          const $ = loadHtml(file);
          applyInlineImages($, distDir, inlinedFiles);
          applyDeadCss($);
          applyRenameCssVars($);
          applyRenameCssClasses($);
          const finalHtml = await applyMinifier($.html());

          writeFileSync(file, finalHtml);
        }

        // External chunks are not processed by applyRenameCssClasses, so any
        // remaining $$$querySelector would query the original class names.
        for (const f of readdirSync(distDir, {
          recursive: true,
          encoding: "utf-8",
        })) {
          if (!f.endsWith(".js")) continue;
          if (
            readFileSync(join(distDir, f), "utf-8").includes("$$$querySelector")
          )
            throw new Error(
              `[build-optimization] $$$querySelector found in external script ${f}; it must be inlined`,
            );
        }

        for (const p of inlinedFiles) {
          try {
            unlinkSync(p);
          } catch {
            // already gone or unremovable — skip
          }
        }

        try {
          if (readdirSync(join(distDir, "_astro")).length === 0)
            rmdirSync(join(distDir, "_astro"));
        } catch {
          // directory doesn't exist or can't be read — nothing to do
        }
      },
    },
  };
}
