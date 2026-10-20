import { QuartzTransformerPlugin } from '@quartz-community/types';
export { QuartzTransformerPlugin } from '@quartz-community/types';
import { KatexOptions } from 'katex';

interface TypstOptions {
    preamble?: string;
    errorColor?: string;
}

interface MathjaxTexOptions {
    macros?: Record<string, string | unknown[]>;
    [key: string]: unknown;
}
interface MathjaxOptions {
    tex?: MathjaxTexOptions;
    [key: string]: unknown;
}
type Args = boolean | number | string | null;
interface MacroType {
    [key: string]: string | Args[];
}
type Engine = "katex" | "mathjax" | "typst";
interface LatexOptions {
    renderEngine: Engine;
    engineByPath: Record<string, Engine>;
    customMacros: MacroType;
    katexOptions: Omit<KatexOptions, "macros" | "output">;
    mathJaxOptions: Omit<MathjaxOptions, "macros">;
    typstOptions: TypstOptions;
}
declare const Latex: QuartzTransformerPlugin<Partial<LatexOptions>>;

export { type Args, Latex, type LatexOptions };
