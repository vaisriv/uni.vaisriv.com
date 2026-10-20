// vaisriv: enable \ce{} / \pu{} chemistry macros (mhchem) in KaTeX
import "katex/contrib/mhchem";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeMathjax from "rehype-mathjax/svg";
import type { QuartzTransformerPlugin } from "@quartz-community/types";
import type { KatexOptions } from "katex";
import type { VFile } from "vfile";
import rehypeTypst, { type TypstOptions } from "./typst";

interface MathjaxTexOptions {
  macros?: Record<string, string | unknown[]>;
  [key: string]: unknown;
}

interface MathjaxOptions {
  tex?: MathjaxTexOptions;
  [key: string]: unknown;
}

export type Args = boolean | number | string | null;

interface MacroType {
  [key: string]: string | Args[];
}

type Engine = "katex" | "mathjax" | "typst";

export interface LatexOptions {
  renderEngine: Engine;
  // vaisriv: per-folder engine, keyed by slug prefix (e.g. { grad: "typst" }).
  // A note's `math:` frontmatter field takes precedence over this.
  engineByPath: Record<string, Engine>;
  customMacros: MacroType;
  katexOptions: Omit<KatexOptions, "macros" | "output">;
  mathJaxOptions: Omit<MathjaxOptions, "macros">;
  typstOptions: TypstOptions;
}

const ENGINES: Engine[] = ["katex", "mathjax", "typst"];
const isEngine = (value: unknown): value is Engine => ENGINES.includes(value as Engine);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Transform = (tree: any, file: VFile) => unknown;

export const Latex: QuartzTransformerPlugin<Partial<LatexOptions>> = (opts) => {
  const engine = opts?.renderEngine ?? "katex";
  const macros = opts?.customMacros ?? {};
  // longest prefix first so more specific paths win
  const pathRules = Object.entries(opts?.engineByPath ?? {})
    .map(([prefix, e]) => [prefix.replace(/^\/+|\/+$/g, ""), e] as const)
    .sort(([a], [b]) => b.length - a.length);
  const enginesInUse = new Set<Engine>([engine, ...pathRules.map(([, e]) => e)]);

  const pickEngine = (file: VFile): Engine => {
    const frontmatter = file.data.frontmatter as Record<string, unknown> | undefined;
    if (isEngine(frontmatter?.math)) return frontmatter.math;
    const slug = String(file.data.slug ?? "");
    for (const [prefix, e] of pathRules) {
      if (slug === prefix || slug.startsWith(prefix + "/")) return e;
    }
    return engine;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rehypeFor = (e: Engine): [any, any] => {
    switch (e) {
      case "katex":
        return [rehypeKatex, { output: "html", macros, ...(opts?.katexOptions ?? {}) }];
      case "typst":
        return [rehypeTypst, opts?.typstOptions ?? {}];
      default:
      case "mathjax":
        return [
          rehypeMathjax,
          {
            ...(opts?.mathJaxOptions ?? {}),
            tex: {
              ...(opts?.mathJaxOptions?.tex ?? {}),
              macros,
            },
          },
        ];
    }
  };

  // rehype-typst embeds the same <style> in every formula's svg, including global rules like
  // `svg { fill: none }` that leak onto the rest of the page; drop them (styled via site css)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripTypstStyles = (node: any, inTypstSvg = false): void => {
    if (!Array.isArray(node.children)) return;
    const className = node.properties?.className;
    const isTypstSvg =
      inTypstSvg ||
      (node.tagName === "svg" && Array.isArray(className) && className.includes("typst-doc"));
    if (isTypstSvg) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      node.children = node.children.filter((child: any) => child.tagName !== "style");
    }
    for (const child of node.children) stripTypstStyles(child, isTypstSvg);
  };

  // dispatch each file to the transformer for its engine, built lazily per engine
  function rehypeMathDispatch(this: unknown) {
    const transforms = new Map<Engine, Transform>();
    return (tree: unknown, file: VFile) => {
      const e = pickEngine(file);
      let transform = transforms.get(e);
      if (!transform) {
        const [attacher, options] = rehypeFor(e);
        transform = attacher.call(this, options) as Transform;
        transforms.set(e, transform);
      }
      if (e !== "typst") return transform(tree, file);
      return Promise.resolve(transform(tree, file)).then(() => stripTypstStyles(tree));
    };
  }

  return {
    name: "Latex",
    markdownPlugins() {
      return [remarkMath];
    },
    htmlPlugins() {
      return [rehypeMathDispatch];
    },
    externalResources() {
      // frontmatter can opt any note into katex, so always ship its resources
      // unless katex is unused by both the default and the path rules
      if (enginesInUse.has("katex")) {
        return {
          css: [{ content: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" }],
          js: [
            {
              src: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/copy-tex.min.js",
              loadTime: "afterDOMReady",
              contentType: "external",
            },
          ],
        };
      }
    },
  };
};
