import { QuartzConfig } from "./quartz/cfg";
import * as Plugin from "./quartz/plugins";

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
    configuration: {
        pageTitle: "Vai's Uni Notes",
        pageTitleSuffix: "",
        enableSPA: true,
        enablePopovers: true,
        analytics: {
            provider: "plausible",
        },
        locale: "en-US",
        baseUrl: "uni.vaisriv.com",
        ignorePatterns: ["private", "templates", ".obsidian"],
        defaultDateType: "modified",
        theme: {
            fontOrigin: "googleFonts",
            cdnCaching: true,
            typography: {
                header: "Schibsted Grotesk",
                body: "Source Sans Pro",
                code: "IBM Plex Mono",
            },
            colors: {
                lightMode: {
                    light: "#fffaf3",
                    lightgray: "#f2e9de",
                    gray: "#9893a5",
                    darkgray: "#797593",
                    dark: "#575279",
                    secondary: "#907aa9",
                    tertiary: "#56949f",
                    highlight: "rgba(144, 122, 169, 0.10)",
                    textHighlight: "#d7827e88",
                },
                darkMode: {
                    light: "#1f1d2e",
                    lightgray: "#26233a",
                    gray: "#6e6a86",
                    darkgray: "#b8b6c9",
                    dark: "#e0def4",
                    secondary: "#c4a7e7",
                    tertiary: "#9ccfd8",
                    highlight: "rgba(196, 167, 231, 0.10)",
                    textHighlight: "#ebbcba88",
                },
            },
        },
    },
    plugins: {
        transformers: [
            Plugin.FrontMatter(),
            Plugin.CreatedModifiedDate({
                priority: ["frontmatter", "git", "filesystem"],
            }),
            Plugin.SyntaxHighlighting({
                theme: {
                    light: "rose-pine-dawn",
                    dark: "rose-pine",
                },
                keepBackground: false,
            }),
            Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
            Plugin.GitHubFlavoredMarkdown(),
            Plugin.TableOfContents(),
            Plugin.CrawlLinks({
                markdownLinkResolution: "shortest",
                prettyLinks: true,
                openLinksInNewTab: false,
                lazyLoad: true,
                externalLinkIcon: true,
            }),
            Plugin.Description(),
            Plugin.Latex({
                renderEngine: "katex",
                customMacros: {
                    // symbols
                    "\\questeq": "\\stackrel{?}{=}",
                    "\\st": "\\text{ s.t. }",
                    "\\wrt": "\\text{ wrt. }",

                    // vectors
                    "\\crvector": "\\begin{bmatrix}#1\\end{bmatrix}",
                    "\\vecb": "\\vec{\\bm{#1}}",

                    // functions
                    "\\func": "\\mathrm{\\,#1}",
                    "\\fn": "\\mathrm{\\,#1}\\left(#2\\right)",

                    // derivatives
                    "\\drv": "\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}",
                    "\\ddrv": "\\frac{\\mathrm{d}^{2}#1}{\\mathrm{d}{#2}^{2}}",
                    "\\deriv":
                        "\\frac{\\mathrm{d}}{\\mathrm{d}#1}\\left(#2\\right)",
                    "\\dderiv":
                        "\\frac{\\mathrm{d}^{2}}{\\mathrm{d}{#1}^{2}}\\left(#2\\right)",

                    // partial derivatives
                    "\\pdrv": "\\frac{\\partial#1}{\\partial#2}",
                    "\\pddrv": "\\frac{\\partial^{2}#1}{\\partial{#2}^{2}}",
                    "\\pderiv":
                        "\\frac{\\partial}{\\partial#1}\\left(#2\\right)",
                    "\\pdderiv":
                        "\\frac{\\partial^{2}}{\\partial{}{#1}^{2}}\\left(#2\\right)",

                    // probability
                    "\\E": "\\mathrm{\\,E}\\left(#1\\right)",
                    "\\Var": "\\mathrm{\\,Var}\\left(#1\\right)",
                    "\\Cov": "\\mathrm{\\,Cov}\\left(#1\\right)",
                    "\\Bias": "\\mathrm{\\,Bias}\\left(#1\\right)",
                    "\\Prob": "\\mathrm{\\,Pr}\\left(#1\\right)",

                    // trig
                    "\\sin": "\\mathrm{\\,sin}\\left(#1\\right)",
                    "\\cos": "\\mathrm{\\,cos}\\left(#1\\right)",
                    "\\tan": "\\mathrm{\\,tan}\\left(#1\\right)",
                    "\\csc": "\\mathrm{\\,csc}\\left(#1\\right)",
                    "\\sec": "\\mathrm{\\,sec}\\left(#1\\right)",
                    "\\cot": "\\mathrm{\\,cot}\\left(#1\\right)",
                    "\\sinh": "\\mathrm{\\,sinh}\\left(#1\\right)",
                    "\\cosh": "\\mathrm{\\,cosh}\\left(#1\\right)",
                    "\\tanh": "\\mathrm{\\,tanh}\\left(#1\\right)",
                    "\\coth": "\\mathrm{\\,coth}\\left(#1\\right)",
                    "\\arcsin": "\\mathrm{\\,arcsin}\\left(#1\\right)",
                    "\\arccos": "\\mathrm{\\,arccos}\\left(#1\\right)",
                    "\\arctan": "\\mathrm{\\,arctan}\\left(#1\\right)",

                    // log, ln, etc
                    "\\log": "\\mathrm{\\,log}\\left(#1\\right)",
                    "\\ln": "\\mathrm{\\,ln}\\left(#1\\right)",

                    // num sets
                    "\\Re": "\\mathfrak{\\,Re}\\left{#1\\right}",
                    "\\Im": "\\mathfrak{\\,Im}\\left{#1\\right}",

                    // laplace
                    "\\laplace": "\\mathscr{\\,L}\\left{#1\\right}",
                    "\\ilaplace": "\\mathscr{\\,L}^{-1}\\left{#1\\right}",

                    // integrals
                    "\\inti": "\\int #1 \\mathrm{\\,d}#2",
                    "\\intd": "\\int_{#1}^{#2} #3 \\mathrm{\\,d}#4",
                },
            }),
        ],
        filters: [Plugin.RemoveDrafts()],
        emitters: [
            Plugin.AliasRedirects(),
            Plugin.ComponentResources(),
            Plugin.ContentPage(),
            Plugin.FolderPage(),
            Plugin.TagPage(),
            Plugin.ContentIndex({
                enableSiteMap: true,
                enableRSS: true,
            }),
            Plugin.Assets(),
            Plugin.Static(),
            Plugin.Favicon(),
            Plugin.NotFoundPage(),
            // Comment out CustomOgImages to speed up build time
            Plugin.CustomOgImages(),
        ],
    },
};

export default config;
