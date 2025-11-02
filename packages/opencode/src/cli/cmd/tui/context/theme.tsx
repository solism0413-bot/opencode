import { SyntaxStyle, RGBA } from "@opentui/core"
import { createMemo, createSignal } from "solid-js"
import { useSync } from "@tui/context/sync"
import { createSimpleContext } from "./helper"
import aura from "../../../../../../tui/internal/theme/themes/aura.json" with { type: "json" }
import ayu from "../../../../../../tui/internal/theme/themes/ayu.json" with { type: "json" }
import catppuccin from "../../../../../../tui/internal/theme/themes/catppuccin.json" with { type: "json" }
import cobalt2 from "../../../../../../tui/internal/theme/themes/cobalt2.json" with { type: "json" }
import dracula from "../../../../../../tui/internal/theme/themes/dracula.json" with { type: "json" }
import everforest from "../../../../../../tui/internal/theme/themes/everforest.json" with { type: "json" }
import github from "../../../../../../tui/internal/theme/themes/github.json" with { type: "json" }
import gruvbox from "../../../../../../tui/internal/theme/themes/gruvbox.json" with { type: "json" }
import kanagawa from "../../../../../../tui/internal/theme/themes/kanagawa.json" with { type: "json" }
import material from "../../../../../../tui/internal/theme/themes/material.json" with { type: "json" }
import matrix from "../../../../../../tui/internal/theme/themes/matrix.json" with { type: "json" }
import monokai from "../../../../../../tui/internal/theme/themes/monokai.json" with { type: "json" }
import nord from "../../../../../../tui/internal/theme/themes/nord.json" with { type: "json" }
import onedark from "../../../../../../tui/internal/theme/themes/one-dark.json" with { type: "json" }
import opencode from "../../../../../../tui/internal/theme/themes/opencode.json" with { type: "json" }
import palenight from "../../../../../../tui/internal/theme/themes/palenight.json" with { type: "json" }
import rosepine from "../../../../../../tui/internal/theme/themes/rosepine.json" with { type: "json" }
import solarized from "../../../../../../tui/internal/theme/themes/solarized.json" with { type: "json" }
import synthwave84 from "../../../../../../tui/internal/theme/themes/synthwave84.json" with { type: "json" }
import tokyonight from "../../../../../../tui/internal/theme/themes/tokyonight.json" with { type: "json" }
import vesper from "../../../../../../tui/internal/theme/themes/vesper.json" with { type: "json" }
import zenburn from "../../../../../../tui/internal/theme/themes/zenburn.json" with { type: "json" }
import { useKV } from "./kv"

type Theme = {
  primary: RGBA
  secondary: RGBA
  accent: RGBA
  error: RGBA
  warning: RGBA
  success: RGBA
  info: RGBA
  text: RGBA
  textMuted: RGBA
  background: RGBA
  backgroundPanel: RGBA
  backgroundElement: RGBA
  border: RGBA
  borderActive: RGBA
  borderSubtle: RGBA
  diffAdded: RGBA
  diffRemoved: RGBA
  diffContext: RGBA
  diffHunkHeader: RGBA
  diffHighlightAdded: RGBA
  diffHighlightRemoved: RGBA
  diffAddedBg: RGBA
  diffRemovedBg: RGBA
  diffContextBg: RGBA
  diffLineNumber: RGBA
  diffAddedLineNumberBg: RGBA
  diffRemovedLineNumberBg: RGBA
  markdownText: RGBA
  markdownHeading: RGBA
  markdownLink: RGBA
  markdownLinkText: RGBA
  markdownCode: RGBA
  markdownBlockQuote: RGBA
  markdownEmph: RGBA
  markdownStrong: RGBA
  markdownHorizontalRule: RGBA
  markdownListItem: RGBA
  markdownListEnumeration: RGBA
  markdownImage: RGBA
  markdownImageText: RGBA
  markdownCodeBlock: RGBA
  syntaxComment: RGBA
  syntaxKeyword: RGBA
  syntaxFunction: RGBA
  syntaxVariable: RGBA
  syntaxString: RGBA
  syntaxNumber: RGBA
  syntaxType: RGBA
  syntaxOperator: RGBA
  syntaxPunctuation: RGBA
}

type HexColor = `#${string}`
type RefName = string
type Variant = {
  dark: HexColor | RefName
  light: HexColor | RefName
}
type ColorValue = HexColor | RefName | Variant | RGBA
type ThemeJson = {
  $schema?: string
  defs?: Record<string, HexColor | RefName>
  theme: Record<keyof Theme, ColorValue>
}

export const BUILTIN_THEMES: Record<string, ThemeJson> = {
  aura,
  ayu,
  catppuccin,
  cobalt2,
  dracula,
  everforest,
  github,
  gruvbox,
  kanagawa,
  material,
  matrix,
  monokai,
  nord,
  ["one-dark"]: onedark,
  opencode,
  palenight,
  rosepine,
  solarized,
  synthwave84,
  tokyonight,
  vesper,
  zenburn,
}

function resolveTheme(theme: ThemeJson, mode: "dark" | "light") {
  const defs = theme.defs ?? {}
  function resolveColor(c: ColorValue): RGBA {
    if (c instanceof RGBA) return c
    if (typeof c === "string") return c.startsWith("#") ? RGBA.fromHex(c) : resolveColor(defs[c])
    return resolveColor(c[mode])
  }
  return Object.fromEntries(
    Object.entries(theme.theme).map(([key, value]) => {
      return [key, resolveColor(value)]
    }),
  ) as Theme
}

// Generate grayscale colors based on terminal background (matches Go implementation)
function generateGrayScale(terminalBg: RGBA, isDark: boolean): RGBA[] {
  const grays: RGBA[] = []

  const bgR = terminalBg.r
  const bgG = terminalBg.g
  const bgB = terminalBg.b

  const luminance = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB

  for (let i = 1; i <= 12; i++) {
    const factor = i / 12.0
    let stepColor: RGBA

    if (isDark) {
      if (luminance < 10) {
        // Very dark/black background
        const grayValue = Math.floor(factor * 0.4 * 255)
        stepColor = RGBA.fromInts(grayValue, grayValue, grayValue, 255)
      } else {
        // Scale up for lighter dark backgrounds
        const newLum = luminance + (255 - luminance) * factor * 0.4
        const ratio = newLum / luminance
        const newR = Math.min(bgR * ratio, 255)
        const newG = Math.min(bgG * ratio, 255)
        const newB = Math.min(bgB * ratio, 255)
        stepColor = RGBA.fromInts(newR, newG, newB, 255)
      }
    } else {
      if (luminance > 245) {
        // Very light/white background
        const grayValue = Math.floor(255 - factor * 0.4 * 255)
        stepColor = RGBA.fromInts(grayValue, grayValue, grayValue, 255)
      } else {
        // Scale down for darker light backgrounds
        const newLum = luminance * (1 - factor * 0.4)
        const ratio = newLum / luminance
        const newR = Math.max(bgR * ratio, 0)
        const newG = Math.max(bgG * ratio, 0)
        const newB = Math.max(bgB * ratio, 0)
        stepColor = RGBA.fromInts(newR, newG, newB, 255)
      }
    }

    grays.push(stepColor)
  }

  return grays
}

// Generate muted text color based on terminal background
function generateMutedTextColor(terminalBg: RGBA, isDark: boolean): RGBA {
  const bgLum = 0.299 * terminalBg.r + 0.587 * terminalBg.g + 0.114 * terminalBg.b

  let grayValue: number
  if (isDark) {
    if (bgLum < 10) {
      // Very dark/black background
      grayValue = 180 // #b4b4b4
    } else {
      // Scale up for lighter dark backgrounds
      grayValue = Math.min(Math.floor(160 + bgLum * 0.3), 200)
    }
  } else {
    if (bgLum > 245) {
      // Very light/white background
      grayValue = 75 // #4b4b4b
    } else {
      // Scale down for darker light backgrounds
      grayValue = Math.max(Math.floor(100 - (255 - bgLum) * 0.2), 60)
    }
  }

  return RGBA.fromInts(grayValue, grayValue, grayValue, 255)
}

function generateSystem(colors: string[], isDark: boolean): ThemeJson {
  const background = colors[0]
  const grays = generateGrayScale(RGBA.fromHex(background), isDark)
  const mutedTextColor = generateMutedTextColor(RGBA.fromHex(background), isDark)

  return {
    theme: {
      // Primary/Brand colors - ANSI 6 (Cyan) and 5 (Magenta)
      primary: colors[6],
      secondary: colors[5],
      accent: colors[6],
      // Status colors
      error: colors[1], // ANSI 1 (Red)
      warning: colors[3], // ANSI 3 (Yellow)
      success: colors[2], // ANSI 2 (Green)
      info: colors[6], // ANSI 6 (Cyan)
      // Text colors - use terminal default
      text: colors[7],
      textMuted: colors[7],
      // Background colors - use terminal default and generated grays
      background: colors[0],
      backgroundPanel: grays[1], // grays[2] in Go (1-indexed)
      backgroundElement: grays[2], // grays[3] in Go (1-indexed)
      // Border colors
      border: grays[6], // grays[7] in Go (1-indexed)
      borderActive: grays[7], // grays[8] in Go (1-indexed)
      borderSubtle: grays[5], // grays[6] in Go (1-indexed)
      // Diff colors
      diffAdded: colors[2], // ANSI 2 (Green)
      diffRemoved: colors[1], // ANSI 1 (Red)
      diffContext: grays[6], // grays[7] in Go (1-indexed)
      diffHunkHeader: grays[6], // grays[7] in Go (1-indexed)
      diffHighlightAdded: colors[2], // ANSI 2 (Green)
      diffHighlightRemoved: colors[1], // ANSI 1 (Red)
      diffAddedBg: grays[0], // grays[2] in Go (1-indexed)
      diffRemovedBg: grays[0], // grays[2] in Go (1-indexed)
      diffContextBg: grays[0], // grays[1] in Go (1-indexed)
      diffLineNumber: grays[5], // grays[6] in Go (1-indexed)
      diffAddedLineNumberBg: grays[2], // grays[3] in Go (1-indexed)
      diffRemovedLineNumberBg: grays[2], // grays[3] in Go (1-indexed)
      // Markdown colors
      markdownText: colors[7],
      markdownHeading: colors[7],
      markdownLink: colors[4], // ANSI 4 (Blue)
      markdownLinkText: colors[6], // ANSI 6 (Cyan)
      markdownCode: colors[2], // ANSI 2 (Green)
      markdownBlockQuote: colors[3], // ANSI 3 (Yellow)
      markdownEmph: colors[3], // ANSI 3 (Yellow)
      markdownStrong: colors[7],
      markdownHorizontalRule: grays[6], // grays[7] in Go (1-indexed)
      markdownListItem: colors[4], // ANSI 4 (Blue)
      markdownListEnumeration: colors[6], // ANSI 6 (Cyan)
      markdownImage: colors[4], // ANSI 4 (Blue)
      markdownImageText: colors[6], // ANSI 6 (Cyan)
      markdownCodeBlock: colors[7],
      // Syntax highlighting
      syntaxComment: mutedTextColor,
      syntaxKeyword: colors[5], // ANSI 5 (Magenta)
      syntaxFunction: colors[4], // ANSI 4 (Blue)
      syntaxVariable: colors[7],
      syntaxString: colors[2], // ANSI 2 (Green)
      syntaxNumber: colors[3], // ANSI 3 (Yellow)
      syntaxType: colors[6], // ANSI 6 (Cyan)
      syntaxOperator: colors[6], // ANSI 6 (Cyan)
      syntaxPunctuation: colors[7],
    },
  }
}

export const { use: useTheme, provider: ThemeProvider } = createSimpleContext({
  name: "Theme",
  init: (props: { mode: "dark" | "light"; system: string[] }) => {
    const sync = useSync()
    const kv = useKV()

    const themes: Record<string, ThemeJson> = {
      ...BUILTIN_THEMES,
      system: generateSystem(props.system, props.mode === "dark"),
    }

    const [theme, setTheme] = createSignal(sync.data.config.theme ?? kv.get("theme", "opencode"))
    const [mode, setMode] = createSignal(props.mode)

    const values = createMemo(() => {
      return resolveTheme(themes[theme()] ?? BUILTIN_THEMES.opencode, mode())
    })

    const syntax = createMemo(() => {
      return SyntaxStyle.fromTheme([
        {
          scope: ["prompt"],
          style: {
            foreground: values().accent,
          },
        },
        {
          scope: ["extmark.file"],
          style: {
            foreground: values().warning,
            bold: true,
          },
        },
        {
          scope: ["extmark.agent"],
          style: {
            foreground: values().secondary,
            bold: true,
          },
        },
        {
          scope: ["extmark.paste"],
          style: {
            foreground: values().background,
            background: values().warning,
            bold: true,
          },
        },
        {
          scope: ["comment"],
          style: {
            foreground: values().syntaxComment,
            italic: true,
          },
        },
        {
          scope: ["comment.documentation"],
          style: {
            foreground: values().syntaxComment,
            italic: true,
          },
        },
        {
          scope: ["string", "symbol"],
          style: {
            foreground: values().syntaxString,
          },
        },
        {
          scope: ["number", "boolean"],
          style: {
            foreground: values().syntaxNumber,
          },
        },
        {
          scope: ["character.special"],
          style: {
            foreground: values().syntaxString,
          },
        },
        {
          scope: ["keyword.return", "keyword.conditional", "keyword.repeat", "keyword.coroutine"],
          style: {
            foreground: values().syntaxKeyword,
            italic: true,
          },
        },
        {
          scope: ["keyword.type"],
          style: {
            foreground: values().syntaxType,
            bold: true,
            italic: true,
          },
        },
        {
          scope: ["keyword.function", "function.method"],
          style: {
            foreground: values().syntaxFunction,
          },
        },
        {
          scope: ["keyword"],
          style: {
            foreground: values().syntaxKeyword,
            italic: true,
          },
        },
        {
          scope: ["keyword.import"],
          style: {
            foreground: values().syntaxKeyword,
          },
        },
        {
          scope: ["operator", "keyword.operator", "punctuation.delimiter"],
          style: {
            foreground: values().syntaxOperator,
          },
        },
        {
          scope: ["keyword.conditional.ternary"],
          style: {
            foreground: values().syntaxOperator,
          },
        },
        {
          scope: ["variable", "variable.parameter", "function.method.call", "function.call"],
          style: {
            foreground: values().syntaxVariable,
          },
        },
        {
          scope: ["variable.member", "function", "constructor"],
          style: {
            foreground: values().syntaxFunction,
          },
        },
        {
          scope: ["type", "module"],
          style: {
            foreground: values().syntaxType,
          },
        },
        {
          scope: ["constant"],
          style: {
            foreground: values().syntaxNumber,
          },
        },
        {
          scope: ["property"],
          style: {
            foreground: values().syntaxVariable,
          },
        },
        {
          scope: ["class"],
          style: {
            foreground: values().syntaxType,
          },
        },
        {
          scope: ["parameter"],
          style: {
            foreground: values().syntaxVariable,
          },
        },
        {
          scope: ["punctuation", "punctuation.bracket"],
          style: {
            foreground: values().syntaxPunctuation,
          },
        },
        {
          scope: [
            "variable.builtin",
            "type.builtin",
            "function.builtin",
            "module.builtin",
            "constant.builtin",
          ],
          style: {
            foreground: values().error,
          },
        },
        {
          scope: ["variable.super"],
          style: {
            foreground: values().error,
          },
        },
        {
          scope: ["string.escape", "string.regexp"],
          style: {
            foreground: values().syntaxKeyword,
          },
        },
        {
          scope: ["keyword.directive"],
          style: {
            foreground: values().syntaxKeyword,
            italic: true,
          },
        },
        {
          scope: ["punctuation.special"],
          style: {
            foreground: values().syntaxOperator,
          },
        },
        {
          scope: ["keyword.modifier"],
          style: {
            foreground: values().syntaxKeyword,
            italic: true,
          },
        },
        {
          scope: ["keyword.exception"],
          style: {
            foreground: values().syntaxKeyword,
            italic: true,
          },
        },
        // Markdown specific styles
        {
          scope: ["markup.heading"],
          style: {
            foreground: values().markdownHeading,
            bold: true,
          },
        },
        {
          scope: ["markup.heading.1"],
          style: {
            foreground: values().markdownHeading,
            bold: true,
          },
        },
        {
          scope: ["markup.heading.2"],
          style: {
            foreground: values().markdownHeading,
            bold: true,
          },
        },
        {
          scope: ["markup.heading.3"],
          style: {
            foreground: values().markdownHeading,
            bold: true,
          },
        },
        {
          scope: ["markup.heading.4"],
          style: {
            foreground: values().markdownHeading,
            bold: true,
          },
        },
        {
          scope: ["markup.heading.5"],
          style: {
            foreground: values().markdownHeading,
            bold: true,
          },
        },
        {
          scope: ["markup.heading.6"],
          style: {
            foreground: values().markdownHeading,
            bold: true,
          },
        },
        {
          scope: ["markup.bold", "markup.strong"],
          style: {
            foreground: values().markdownStrong,
            bold: true,
          },
        },
        {
          scope: ["markup.italic"],
          style: {
            foreground: values().markdownEmph,
            italic: true,
          },
        },
        {
          scope: ["markup.list"],
          style: {
            foreground: values().markdownListItem,
          },
        },
        {
          scope: ["markup.quote"],
          style: {
            foreground: values().markdownBlockQuote,
            italic: true,
          },
        },
        {
          scope: ["markup.raw", "markup.raw.block"],
          style: {
            foreground: values().markdownCode,
          },
        },
        {
          scope: ["markup.raw.inline"],
          style: {
            foreground: values().markdownCode,
            background: values().background,
          },
        },
        {
          scope: ["markup.link"],
          style: {
            foreground: values().markdownLink,
            underline: true,
          },
        },
        {
          scope: ["markup.link.label"],
          style: {
            foreground: values().markdownLinkText,
            underline: true,
          },
        },
        {
          scope: ["markup.link.url"],
          style: {
            foreground: values().markdownLink,
            underline: true,
          },
        },
        {
          scope: ["label"],
          style: {
            foreground: values().markdownLinkText,
          },
        },
        {
          scope: ["spell", "nospell"],
          style: {
            foreground: values().text,
          },
        },
        {
          scope: ["conceal"],
          style: {
            foreground: values().textMuted,
          },
        },
        // Additional common highlight groups
        {
          scope: ["string.special", "string.special.url"],
          style: {
            foreground: values().markdownLink,
            underline: true,
          },
        },
        {
          scope: ["character"],
          style: {
            foreground: values().syntaxString,
          },
        },
        {
          scope: ["float"],
          style: {
            foreground: values().syntaxNumber,
          },
        },
        {
          scope: ["comment.error"],
          style: {
            foreground: values().error,
            italic: true,
            bold: true,
          },
        },
        {
          scope: ["comment.warning"],
          style: {
            foreground: values().warning,
            italic: true,
            bold: true,
          },
        },
        {
          scope: ["comment.todo", "comment.note"],
          style: {
            foreground: values().info,
            italic: true,
            bold: true,
          },
        },
        {
          scope: ["namespace"],
          style: {
            foreground: values().syntaxType,
          },
        },
        {
          scope: ["field"],
          style: {
            foreground: values().syntaxVariable,
          },
        },
        {
          scope: ["type.definition"],
          style: {
            foreground: values().syntaxType,
            bold: true,
          },
        },
        {
          scope: ["keyword.export"],
          style: {
            foreground: values().syntaxKeyword,
          },
        },
        {
          scope: ["attribute", "annotation"],
          style: {
            foreground: values().warning,
          },
        },
        {
          scope: ["tag"],
          style: {
            foreground: values().error,
          },
        },
        {
          scope: ["tag.attribute"],
          style: {
            foreground: values().syntaxKeyword,
          },
        },
        {
          scope: ["tag.delimiter"],
          style: {
            foreground: values().syntaxOperator,
          },
        },
        {
          scope: ["markup.strikethrough"],
          style: {
            foreground: values().textMuted,
          },
        },
        {
          scope: ["markup.underline"],
          style: {
            foreground: values().text,
            underline: true,
          },
        },
        {
          scope: ["markup.list.checked"],
          style: {
            foreground: values().success,
          },
        },
        {
          scope: ["markup.list.unchecked"],
          style: {
            foreground: values().textMuted,
          },
        },
        {
          scope: ["diff.plus"],
          style: {
            foreground: values().diffAdded,
          },
        },
        {
          scope: ["diff.minus"],
          style: {
            foreground: values().diffRemoved,
          },
        },
        {
          scope: ["diff.delta"],
          style: {
            foreground: values().diffContext,
          },
        },
        {
          scope: ["error"],
          style: {
            foreground: values().error,
            bold: true,
          },
        },
        {
          scope: ["warning"],
          style: {
            foreground: values().warning,
            bold: true,
          },
        },
        {
          scope: ["info"],
          style: {
            foreground: values().info,
          },
        },
        {
          scope: ["debug"],
          style: {
            foreground: values().textMuted,
          },
        },
      ])
    })

    return {
      theme: new Proxy(values(), {
        get(_target, prop) {
          // @ts-expect-error
          return values()[prop]
        },
      }),
      get selected() {
        return theme()
      },
      syntax,
      mode,
      setMode(mode: "dark" | "light") {
        setMode(mode)
      },
      get all() {
        return themes
      },
      set(theme: string) {
        if (!themes[theme]) return
        setTheme(theme)
        kv.set("theme", theme)
      },
      get ready() {
        return sync.ready
      },
    }
  },
})
