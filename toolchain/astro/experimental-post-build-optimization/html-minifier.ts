import { StrictCsp } from "strict-csp";
import { minify } from "html-minifier-next";

export async function applyMinifier(html: string): Promise<string> {
  const minified = await minify(html, { preset: "comprehensive" });
  const csp = new StrictCsp(minified);
  csp.refactorSourcedScriptsForHashBasedCsp();
  const scriptHashes = csp.hashAllInlineScripts();
  const strictCsp = StrictCsp.getStrictCsp(scriptHashes, {
    enableBrowserFallbacks: true,
  });
  csp.addMetaTag(strictCsp);
  return csp.serializeDom();
}
