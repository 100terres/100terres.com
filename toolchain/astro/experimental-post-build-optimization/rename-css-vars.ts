import type { CheerioAPI } from "cheerio";
import { shortName, transformStyles, transformInlineStyles } from "./utils";

export function applyRenameCssVars($: CheerioAPI): void {
  const declared = new Set<string>();
  transformStyles($, {
    Declaration: {
      custom(prop) {
        declared.add(prop.name);
      },
    },
  });

  const renameMap = new Map(
    [...declared].map((name, i) => [name, `--${shortName(i)}`]),
  );

  const dashedIdentVisitor = {
    DashedIdent(ident: string) {
      return renameMap.get(ident);
    },
  };

  transformStyles($, dashedIdentVisitor);
  transformInlineStyles($, dashedIdentVisitor);
}
