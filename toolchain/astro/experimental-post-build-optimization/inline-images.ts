import { readFileSync } from "fs";
import { join, extname } from "path";
import type { CheerioAPI } from "cheerio";

const mimeTypes: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export function applyInlineImages(
  $: CheerioAPI,
  distDir: string,
  inlinedFiles: Set<string>,
): void {
  $("img[data-inline]").each((_, el) => {
    const src = $(el).attr("src");

    if (!src) {
      return;
    }

    const assetPath = join(distDir, src);
    const ext = extname(assetPath).toLowerCase();
    const mime = mimeTypes[ext] ?? "application/octet-stream";

    let imageBuffer: Buffer;
    try {
      imageBuffer = readFileSync(assetPath);
    } catch {
      return;
    }

    inlinedFiles.add(assetPath);
    const dataUri = `data:${mime};base64,${imageBuffer.toString("base64")}`;

    $(el).attr("src", dataUri);
    $(el).removeAttr("data-inline");
    $(el).removeAttr("loading");
    $(el).removeAttr("decoding");
  });
}
