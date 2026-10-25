export const EML_ID = "eml";

class EmlState {
  constructor(inHeaders, boundaries) {
    this.inHeaders = inHeaders;
    this.boundaries = boundaries;
  }

  clone() {
    return new EmlState(this.inHeaders, this.boundaries.slice());
  }

  equals(other) {
    return (
      other instanceof EmlState &&
      other.inHeaders === this.inHeaders &&
      other.boundaries.length === this.boundaries.length &&
      other.boundaries.every((b, i) => b === this.boundaries[i])
    );
  }
}

const HEADER = /^([A-Za-z0-9!#$%&'*+.^_`|~-]+)(\s*:)/;
const BOUNDARY_PARAM = /boundary\s*=\s*"?([^";\s]+)"?/i;

export function registerEml(monaco) {
  monaco.languages.register({ id: EML_ID, extensions: [".eml"], aliases: ["Email"] });
  monaco.languages.setTokensProvider(EML_ID, {
    getInitialState: () => new EmlState(true, []),
    tokenize(line, state) {
      const next = state.clone();
      const tokens = [];

      if (next.boundaries.length) {
        const trimmed = line.trimEnd();
        const hit = next.boundaries.find((b) => trimmed === `--${b}` || trimmed === `--${b}--`);
        if (hit) {
          tokens.push({ startIndex: 0, scopes: "keyword.boundary" });
          if (trimmed.endsWith("--") && trimmed === `--${hit}--`) {
            next.boundaries = next.boundaries.filter((b) => b !== hit);
            next.inHeaders = false;
          } else {
            next.inHeaders = true;
          }
          return { tokens, endState: next };
        }
      }

      if (next.inHeaders) {
        if (line.trim() === "") {
          next.inHeaders = false;
          return { tokens: [{ startIndex: 0, scopes: "" }], endState: next };
        }
        const boundary = BOUNDARY_PARAM.exec(line);
        if (boundary && !next.boundaries.includes(boundary[1])) next.boundaries.push(boundary[1]);
        const header = HEADER.exec(line);
        if (header) {
          tokens.push({ startIndex: 0, scopes: "attribute.name.header" });
          tokens.push({ startIndex: header[1].length, scopes: "delimiter" });
          tokens.push({ startIndex: header[0].length, scopes: "string.header" });
        } else if (/^\s/.test(line)) {
          tokens.push({ startIndex: 0, scopes: "string.header" });
        } else {
          tokens.push({ startIndex: 0, scopes: "invalid" });
        }
        return { tokens, endState: next };
      }

      tokens.push({ startIndex: 0, scopes: /^>/.test(line) ? "comment.quote" : "" });
      return { tokens, endState: next };
    },
  });
}

export function defineThemes(monaco) {
  const rules = (dark) => [
    { token: "keyword", foreground: dark ? "ff7b72" : "cf222e" },
    { token: "type", foreground: dark ? "d2a8ff" : "8250df" },
    { token: "attribute.name", foreground: dark ? "79c0ff" : "0550ae" },
    { token: "variable", foreground: dark ? "ffa657" : "953800" },
    { token: "string", foreground: dark ? "a5d6ff" : "0a3069" },
    { token: "string.heredoc", foreground: dark ? "79c0ff" : "0550ae" },
    { token: "string.escape", foreground: dark ? "79c0ff" : "0550ae" },
    { token: "number", foreground: dark ? "79c0ff" : "0550ae" },
    { token: "comment", foreground: dark ? "8b949e" : "6e7781" },
    { token: "attribute.name.header", foreground: dark ? "d2a8ff" : "8250df" },
    { token: "string.header", foreground: dark ? "f4f4f6" : "0a0a0e" },
    { token: "keyword.boundary", foreground: dark ? "ff7b72" : "cf222e" },
    { token: "comment.quote", foreground: dark ? "8b949e" : "6e7781" },
    { token: "invalid", foreground: dark ? "f85149" : "cf222e" },
  ];
  const colors = (dark) => ({
    "editor.background": dark ? "#08080b" : "#ffffff",
    "editorGutter.background": dark ? "#08080b" : "#ffffff",
    "editor.foreground": dark ? "#f4f4f6" : "#0a0a0e",
    "editorLineNumber.foreground": dark ? "#6e6e78" : "#a3a3ad",
    "editorLineNumber.activeForeground": dark ? "#f4f4f6" : "#0a0a0e",
    "editor.lineHighlightBackground": dark ? "#ffffff08" : "#0000000a",
    "editor.lineHighlightBorder": "#00000000",
    "editorCursor.foreground": "#db2d54",
    "editor.selectionBackground": dark ? "#db2d5440" : "#db2d5426",
    "editor.inactiveSelectionBackground": dark ? "#db2d5426" : "#db2d5418",
    "editorWidget.background": dark ? "#0e0e13" : "#ffffff",
    "editorWidget.border": dark ? "#26262f" : "#e6e6ea",
    "focusBorder": "#00000000",
  });
  monaco.editor.defineTheme("sievepad-light", { base: "vs", inherit: true, rules: rules(false), colors: colors(false) });
  monaco.editor.defineTheme("sievepad-dark", { base: "vs-dark", inherit: true, rules: rules(true), colors: colors(true) });
}
