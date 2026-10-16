import { describe, expect, it } from "vitest";
import { Latex } from "../src/transformer";
import { VFile } from "vfile";
import { createCtx } from "./helpers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const render = async (opts: any, data: Record<string, unknown>, math = "x^2") => {
  const tree = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "code",
        properties: { className: ["math-inline"] },
        children: [{ type: "text", value: math }],
      },
    ],
  };
  const file = new VFile("");
  file.data = data;
  const [attacher] = Latex(opts).htmlPlugins?.(createCtx()) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (attacher as any).call({}, undefined)(tree, file);
  return JSON.stringify(tree);
};

describe("Latex", () => {
  it("returns remarkMath as markdown plugin", () => {
    const ctx = createCtx();
    const transformer = Latex();
    const plugins = transformer.markdownPlugins?.(ctx) ?? [];
    expect(plugins).toHaveLength(1);
  });

  it("defaults to katex render engine", () => {
    const ctx = createCtx();
    const transformer = Latex();
    const plugins = transformer.htmlPlugins?.(ctx) ?? [];
    expect(plugins).toHaveLength(1);
  });

  it("uses mathjax when configured", () => {
    const ctx = createCtx();
    const transformer = Latex({ renderEngine: "mathjax" });
    const plugins = transformer.htmlPlugins?.(ctx) ?? [];
    expect(plugins).toHaveLength(1);
  });

  it("provides katex external resources", () => {
    const ctx = createCtx();
    const transformer = Latex({ renderEngine: "katex" });
    const resources = transformer.externalResources?.(ctx);
    expect(resources?.css).toHaveLength(1);
    expect(resources?.js).toHaveLength(1);
  });

  it("has name Latex", () => {
    const transformer = Latex();
    expect(transformer.name).toBe("Latex");
  });

  describe("engineByPath", () => {
    const opts = { renderEngine: "katex", engineByPath: { grad: "typst" } };

    it("uses the default engine outside matched paths", async () => {
      const out = await render(opts, { slug: "undergrad/a" });
      expect(out).toContain('"katex"');
      expect(out).not.toContain('"svg"');
    });

    it("uses the path engine for matched slugs", async () => {
      const out = await render(opts, { slug: "grad/26f/a" }, "sum_(i=1)^n x_i");
      expect(out).toContain('"svg"');
      expect(out).not.toContain('"katex"');
      expect(out).not.toContain('"tagName":"style"');
    });

    it("does not match on a bare prefix of a segment", async () => {
      const out = await render(opts, { slug: "graduation/a" });
      expect(out).toContain('"katex"');
    });

    it("lets frontmatter math override the path rule", async () => {
      const out = await render(opts, { slug: "grad/a", frontmatter: { math: "katex" } });
      expect(out).toContain('"katex"');
    });

    it("keeps katex resources when katex is only a fallback", () => {
      const transformer = Latex({ renderEngine: "typst", engineByPath: { undergrad: "katex" } });
      expect(transformer.externalResources?.(createCtx())?.css).toHaveLength(1);
    });
  });
});
