// vaisriv: vendored from @myriaddreamin/rehype-typst 0.7.0, which hard-codes its templates.
// Adds a `preamble` (imports, #set/#let rules) prepended to every formula, and routes
// failed compiles to the error span instead of splicing an empty result into the tree.
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";
import { toText } from "hast-util-to-text";
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { SKIP, visitParents } from "unist-util-visit-parents";
import type { Element, ElementContent, Parent, Root } from "hast";
import type { VFile } from "vfile";

export interface TypstOptions {
  // typst source inserted before every formula
  preamble?: string;
  errorColor?: string;
}

interface RenderResult {
  svg: string;
  baselinePosition?: number;
}

let compiler: NodeCompiler | undefined;

const inlineTemplate = (preamble: string, code: string) => `
#set page(height: auto, width: auto, margin: 0pt)
${preamble}

#let s = state("t", (:))

#let pin(t) = context {
  let width = measure(line(length: here().position().y)).width
  s.update(it => it.insert(t, width) + it)
}

#show math.equation: it => {
  box(it, inset: (top: 0.5em, bottom: 0.5em))
}

$pin("l1")${code}$

#context [
  #metadata(s.final().at("l1")) <label>
]
`;

const displayTemplate = (preamble: string, code: string) => `
#set page(height: auto, width: auto, margin: 0pt)
${preamble}

$ ${code} $
`;

function renderToSVGString(code: string, displayMode: boolean, preamble: string): RenderResult {
  const $typst = (compiler ||= NodeCompiler.create());
  try {
    const template = displayMode ? displayTemplate : inlineTemplate;
    const docRes = $typst.compile({ mainFileContent: template(preamble, code) });
    if (!docRes.result) {
      const diags = $typst.fetchDiagnostics(docRes.takeDiagnostics()!);
      throw new Error(diags.map((d) => d.message).join("; ") || "typst compile failed");
    }
    const doc = docRes.result;
    const res: RenderResult = { svg: $typst.svg(doc) };
    if (!displayMode) {
      const query = $typst.query(doc, { selector: "<label>" });
      // value is a length like "12.3pt"; drop the unit
      res.baselinePosition = parseFloat(query[0].value.slice(0, -2));
    }
    return res;
  } finally {
    $typst.evictCache(10);
  }
}

export default function rehypeTypst(options?: TypstOptions | null) {
  const preamble = options?.preamble ?? "";
  const errorColor = options?.errorColor || "#cc0000";

  return async function (tree: Root, file: VFile) {
    const matches: [Element, Parent[]][] = [];
    visitParents(tree, "element", (element, parents) => {
      matches.push([element, parents as Parent[]]);
    });

    const visitor = async (element: Element, parents: Parent[]) => {
      const classes = Array.isArray(element.properties.className)
        ? element.properties.className
        : [];
      // ```math blocks, remark-math flow math ($$), remark-math text math ($)
      const languageMath = classes.includes("language-math");
      const mathDisplay = classes.includes("math-display");
      const mathInline = classes.includes("math-inline");
      let displayMode = mathDisplay;

      if (!languageMath && !mathDisplay && !mathInline) return;

      let parent = parents[parents.length - 1];
      let scope: Element = element;

      // ```math generates <pre><code>; replace the <pre> and render as display
      if (
        element.tagName === "code" &&
        languageMath &&
        parent &&
        parent.type === "element" &&
        (parent as Element).tagName === "pre"
      ) {
        scope = parent as Element;
        parent = parents[parents.length - 2];
        displayMode = true;
      }

      if (!parent) return;

      const value = toText(scope, { whitespace: "pre" });

      let result: ElementContent[];
      try {
        const rendered = renderToSVGString(value, displayMode, preamble);
        const root = fromHtmlIsomorphic(rendered.svg, { fragment: true });
        const svg = root.children[0] as Element;
        const defaultEm = 11;
        const height = parseFloat(String(svg.properties["dataHeight"]));
        const width = parseFloat(String(svg.properties["dataWidth"]));
        const shiftEm = (height - (rendered.baselinePosition ?? 0)) / defaultEm;
        svg.properties.style = `vertical-align: -${shiftEm}em;`;
        svg.properties.height = `${height / defaultEm}em`;
        svg.properties.width = `${width / defaultEm}em`;
        if (displayMode) {
          svg.properties.style += "; display: block; margin: 0 auto;";
        }
        result = root.children as ElementContent[];
      } catch (error) {
        file.message("Could not render math with typst", {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ancestors: [...parents, element] as any,
          cause: error as Error,
          place: element.position,
          source: "rehype-typst",
        });
        result = [
          {
            type: "element",
            tagName: "span",
            properties: {
              className: ["typst-error"],
              style: "color:" + errorColor,
              title: String(error),
            },
            children: [{ type: "text", value }],
          },
        ];
      }

      const index = parent.children.indexOf(scope);
      parent.children.splice(index, 1, ...result);
      return SKIP;
    };

    await Promise.all(matches.map(([element, parents]) => visitor(element, parents)));
  };
}
