// Notes are stored either as Tiptap HTML (`format: "html"`, written by the web
// app and now the mobile rich-text editor) or as plain text (`format: "plain"`,
// legacy mobile notes). These helpers convert between that stored shape, the
// HTML the editor is seeded with, and the plain-text preview shown on cards.

const LINE_BREAK = /<br\s*\/?>/gi;
// Closing tags that end a visual block, so the preview gains a line break there.
const BLOCK_END = /<\/(p|div|h[1-6]|li|blockquote|ul|ol|tr|pre)>/gi;
const ANY_TAG = /<[^>]*>/g;
// Per-line whitespace run (spaces, tabs, non-breaking spaces) — but not newlines,
// which carry the block structure we just reconstructed.
const INLINE_SPACE = /[^\S\n]+/g;

/** Decode the handful of HTML entities Tiptap emits, leaving `&amp;` for last. */
function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#3?9;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&");
}

/** Escape user text before it is placed inside generated HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Collapse inline whitespace per line and drop runs of blank lines. */
function normalizeLines(value: string): string {
  const lines = value
    .split("\n")
    .map((line) => line.replace(INLINE_SPACE, " ").trim());
  const out: string[] = [];
  for (const line of lines) {
    if (line === "" && (out.length === 0 || out[out.length - 1] === "")) {
      continue;
    }
    out.push(line);
  }
  return out.join("\n").trim();
}

/** Strip Tiptap HTML down to readable plain text, keeping block line breaks. */
function htmlToText(html: string): string {
  const withBreaks = html.replace(LINE_BREAK, "\n").replace(BLOCK_END, "\n");
  return normalizeLines(decodeEntities(withBreaks.replace(ANY_TAG, "")));
}

/**
 * Plain-text preview for the notes list. HTML notes (web-authored or migrated)
 * are stripped to text with their block structure preserved as newlines; plain
 * notes are just tidied. The result may contain newlines — the card clamps them.
 */
export function notePreview(contents: string, format: string): string {
  return format === "html" ? htmlToText(contents) : normalizeLines(contents);
}

/**
 * HTML to seed the rich-text editor with. HTML notes pass through untouched;
 * plain notes become paragraphs so they render and stay editable as rich text.
 */
export function toEditorHtml(contents: string, format: string): string {
  if (format === "html") {
    return contents;
  }
  const text = contents.replace(/\r\n?/g, "\n");
  if (text.trim() === "") {
    return "";
  }
  return text
    .split("\n")
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

/** Whether editor HTML carries no visible text (e.g. Tiptap's empty `<p></p>`). */
export function isBlankHtml(html: string): boolean {
  return htmlToText(html) === "";
}
