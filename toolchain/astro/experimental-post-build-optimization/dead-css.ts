import type { CheerioAPI } from "cheerio";
import { transformStyles, transformInlineStyles, styleText } from "./utils";
import type { Visitor } from "lightningcss";

export function applyDeadCss($: CheerioAPI): void {
  let changed = true;

  while (changed) {
    changed = false;

    const used = new Set<string>();

    $("style").each((_, el) => {
      styleText(el)
        ?.matchAll(/var\(\s*(--[\w-]+)/g)
        .forEach((matches) => matches[1] && used.add(matches[1]));
    });

    $("[style]").each((_, el) => {
      ($(el).attr("style") ?? "")
        .matchAll(/var\(\s*(--[\w-]+)/g)
        .forEach((match) => match[1] && used.add(match[1]));
    });

    const visitor: Visitor<never> = {
      Declaration: {
        custom(prop) {
          if (!prop.name.startsWith("--")) {
            return;
          }

          if (!used.has(prop.name)) {
            changed = true;

            return [];
          }

          return;
        },
      },
    };

    transformStyles($, visitor);
    transformInlineStyles($, visitor);
  }
}
