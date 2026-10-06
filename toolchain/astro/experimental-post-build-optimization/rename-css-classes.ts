import type { CheerioAPI } from "cheerio";
import type * as ESTree from "estree";
import * as acorn from "acorn";
import { simple as walkSimple } from "acorn-walk";
import { analyze } from "eslint-scope";
import MagicString from "magic-string";
import { shortName, transformStyles, isText } from "./utils";

export function applyRenameCssClasses($: CheerioAPI): void {
  const declaredClasses = new Set<string>();

  transformStyles($, {
    Selector(selector) {
      for (const component of selector) {
        if (component.type === "class") {
          declaredClasses.add(component.name);
        }
      }
    },
  });

  const renameMap = new Map(
    [...declaredClasses].map((name, i) => [name, shortName(i)]),
  );

  transformStyles($, {
    Selector(selector) {
      return selector.map((component) => {
        if (component.type !== "class") {
          return component;
        }

        const newClassName = renameMap.get(component.name);

        return newClassName ? { ...component, name: newClassName } : component;
      });
    },
  });

  for (const [oldClassName, newClassName] of renameMap) {
    $(`[class~="${oldClassName}"]`).each((_, el) => {
      const classes = ($(el).attr("class") ?? "").split(/\s+/);
      $(el).attr(
        "class",
        classes
          .map((className) =>
            className === oldClassName ? newClassName : className,
          )
          .join(" "),
      );
    });
  }

  renameSelectorInScripts($, renameMap);
}

const MARKER = "$$$querySelector";

function renameSelectorInScripts(
  $: CheerioAPI,
  renameMap: Map<string, string>,
): void {
  $("script").each((_, scriptElement) => {
    const textNode = scriptElement.children[0];
    if (textNode && isText(textNode) && textNode.data.includes(MARKER)) {
      textNode.data = inlineHelperCalls(textNode.data, renameMap);
    }
  });
}

function inlineHelperCalls(
  source: string,
  renameMap: Map<string, string>,
): string {
  const ast = acorn.parse(source, {
    ecmaVersion: "latest",
    sourceType: "module",
    ranges: true, // required by eslint-scope
  });
  const scopeManager = analyze(ast as unknown as ESTree.Program, {
    ecmaVersion: 2022,
    sourceType: "module",
  });
  const output = new MagicString(source);

  // 1. Collect the helper declarations, every call indexed by its callee, and
  // the calls whose callee is the helper definition itself (the minifier
  // inlines a single-use helper into its call site).
  const helpers: [acorn.VariableDeclaration, acorn.VariableDeclarator][] = [];
  const callsByCallee = new Map<acorn.Node, acorn.CallExpression>();
  const directCalls: acorn.CallExpression[] = [];
  walkSimple(ast, {
    VariableDeclaration(declaration) {
      for (const declarator of declaration.declarations) {
        if (isHelperDefinition(declarator.init)) {
          helpers.push([declaration, declarator]);
        }
      }
    },
    CallExpression(call) {
      callsByCallee.set(call.callee, call);
      if (isHelperDefinition(call.callee as acorn.Expression)) {
        directCalls.push(call);
      }
    },
  });

  for (const [declaration, declarator] of helpers) {
    const [variable] = scopeManager.getDeclaredVariables(
      declarator as unknown as ESTree.Node,
    );
    for (const reference of variable?.references ?? []) {
      const identifier = reference.identifier as unknown as acorn.Identifier;
      if (identifier === declarator.id) continue; // the declaration itself

      const call = callsByCallee.get(identifier);
      if (!call) fail("must be called directly", source, identifier);
      inlineCall(output, source, call, renameMap);
    }

    removeDeclarator(output, declaration, declarator);
  }

  for (const call of directCalls) {
    inlineCall(output, source, call, renameMap);
  }

  const result = output.toString();
  if (result.includes(MARKER)) {
    fail("is still present after rewriting", result, {
      start: result.indexOf(MARKER),
    });
  }
  return result;
}

// `Object.assign(fn, { __q: MARKER })`, quoted with "…" or `…`
function isHelperDefinition(node: acorn.Expression | null | undefined) {
  return (
    node?.type === "CallExpression" &&
    node.arguments.some(
      (arg) =>
        arg.type === "ObjectExpression" &&
        arg.properties.some(
          (p) =>
            p.type === "Property" &&
            ((p.value.type === "Literal" && p.value.value === MARKER) ||
              (p.value.type === "TemplateLiteral" &&
                p.value.quasis[0]?.value.cooked === MARKER)),
        ),
    )
  );
}

// helper(el, ".foo") → (el).querySelector(".a")
function inlineCall(
  output: MagicString,
  source: string,
  call: acorn.CallExpression,
  renameMap: Map<string, string>,
): void {
  const [el, selector] = call.arguments;
  if (call.arguments.length !== 2 || !el || !selector) {
    fail("expects exactly (element, selector)", source, call);
  }

  // Only the text between the arguments is replaced, so a nested helper call
  // inside them can still be rewritten on its own.
  output.overwrite(call.start, el.start, "(");
  output.overwrite(el.end, selector.start, ").querySelector(");

  // Rename the classes in the selector, where `${…}` parts are blanked out.
  const text = selectorText(source, selector);
  if (text === null) {
    fail("selector must be a string or template literal", source, call);
  }
  if (/\.[\w-]*\0/.test(text)) {
    fail("cannot rename a class built from an expression", source, call);
  }
  const textStart = selector.start + 1; // after the opening quote
  for (const { 1: name, index } of text.matchAll(CLASS_IN_SELECTOR)) {
    const newName = name && renameMap.get(name);
    if (!newName) continue;
    const nameStart = textStart + index + 1; // after the "."
    output.overwrite(nameStart, nameStart + name.length, newName);
  }
}

// The selector's text between its quotes, with each `${…}` replaced by "\0"s
// of the same length, so offsets in the text still map to the source.
function selectorText(source: string, selector: acorn.Node): string | null {
  const node = selector as acorn.AnyNode;
  if (node.type === "Literal" && typeof node.value === "string") {
    return source.slice(node.start + 1, node.end - 1);
  }
  if (node.type === "TemplateLiteral") {
    return node.quasis
      .map((quasi, i) => {
        const next = node.quasis[i + 1];
        const blank = next ? "\0".repeat(next.start - quasi.end) : "";
        return source.slice(quasi.start, quasi.end) + blank;
      })
      .join("");
  }
  return null;
}

// Matches quoted attribute values (skipped) or `.class` names (group 1).
const CLASS_IN_SELECTOR = /"[^"]*"|'[^']*'|\.(-?[_a-zA-Z][\w-]*)/g;

// Removes `name = init` along with its comma, or the whole statement if it
// declares nothing else.
function removeDeclarator(
  output: MagicString,
  declaration: acorn.VariableDeclaration,
  declarator: acorn.VariableDeclarator,
): void {
  const { declarations } = declaration;
  const index = declarations.indexOf(declarator);
  const next = declarations[index + 1];
  const previous = declarations[index - 1];

  if (next) output.remove(declarator.start, next.start);
  else if (previous) output.remove(previous.end, declarator.end);
  else output.remove(declaration.start, declaration.end);
}

function fail(message: string, source: string, node: { start: number }): never {
  const snippet = source.slice(node.start, node.start + 60);
  throw new Error(`[rename-css-classes] ${MARKER} ${message}: ${snippet}`);
}
