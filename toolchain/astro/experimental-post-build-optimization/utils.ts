import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { load } from "cheerio";
import type { CheerioAPI } from "cheerio";
import { parse } from "parse5";
import { adapter } from "parse5-htmlparser2-tree-adapter";
import { transform, transformStyleAttribute } from "lightningcss";
import type { Visitor } from "lightningcss";

export function isText(node: { nodeType: number }): node is Text {
  return node.nodeType === 3; // Node.TEXT_NODE
}

export function htmlFiles(dir: URL): { distDir: string; files: string[] } {
  const distDir = fileURLToPath(dir);
  return {
    distDir,
    files: readdirSync(distDir, { recursive: true, encoding: "utf-8" })
      .filter((f) => f.endsWith(".html"))
      .map((f) => join(distDir, f)),
  };
}

export function loadHtml(file: string) {
  return load(parse(readFileSync(file, "utf-8"), { treeAdapter: adapter }));
}

export interface DomEl {
  children: { nodeType: number; data?: unknown }[];
}

export function styleText(el: DomEl): string | null {
  const tn = el.children[0];
  return tn && isText(tn) ? tn.data : null;
}

export function setStyleText(el: DomEl, css: string) {
  const tn = el.children[0];
  if (tn && isText(tn)) tn.data = css;
}

export function shortName(i: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let name = "";
  let n = i;
  do {
    name = chars.charAt(n % 26) + name;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return name;
}

export function transformStyles($: CheerioAPI, visitor: Visitor<never>): void {
  $("style").each((_, el) => {
    const css = styleText(el);
    if (!css) return;
    const { code } = transform({
      filename: "inline.css",
      code: Buffer.from(css),
      visitor,
    });
    setStyleText(el, Buffer.from(code).toString("utf-8"));
  });
}

export function transformInlineStyles(
  $: CheerioAPI,
  visitor: Visitor<never>,
): void {
  $("[style]").each((_, el) => {
    const val = $(el).attr("style");
    if (!val) return;
    const { code } = transformStyleAttribute({
      code: Buffer.from(val),
      visitor,
    });
    $(el).attr("style", Buffer.from(code).toString("utf-8"));
  });
}
