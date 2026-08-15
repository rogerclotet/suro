import { CONVERGENCE_400_DATA_URI } from "@/lib/convergence-font";
import type { Theme } from "@/theme";

/**
 * The rich-text CSS shared by the two note WebViews — the tentap editor and the
 * read-only viewer — so a note looks identical whether you're reading or
 * editing it. `root` is the selector the note content lives under
 * (`.ProseMirror` in the editor, `body` in the viewer). Mirrors the `.rich-text`
 * rules in apps/web/src/styles/globals.css.
 */
export function richTextCss(t: Theme, root: string): string {
  return `
    @font-face {
      font-family: "Convergence";
      font-style: normal;
      font-weight: 400;
      src: url("${CONVERGENCE_400_DATA_URI}") format("truetype");
    }
    ${root} {
      background-color: ${t.bg};
      color: ${t.text};
      font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      padding: 12px 16px 24px 16px;
    }
    ${root} a { color: ${t.primary}; }
    ${root} h2,
    ${root} h3 {
      font-family: "Convergence", -apple-system, system-ui, sans-serif;
    }
    ${root} h2 { font-size: 1.4em; }
    ${root} h3 { font-size: 1.2em; }
    ${root} blockquote {
      border-left: 3px solid ${t.border};
      padding-left: 12px;
      color: ${t.muted};
    }
  `;
}
