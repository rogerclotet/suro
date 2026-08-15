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

// The tags the note editors can produce — the same allowlist the web viewer
// feeds DOMPurify (apps/web/src/lib/sanitize-rich-text.ts).
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "s",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
]);
// Schemes a note link may point at; anything else (javascript:, data:, …) is
// dropped so the anchor renders as plain text.
const SAFE_HREF = /^\s*(https?:|mailto:|tel:)/i;
// Elements whose *content* is code, not text, so the whole block goes.
const RAW_CONTENT_BLOCK = /<(script|style)\b[\s\S]*?<\/\1\s*>/gi;
const UNCLOSED_RAW_CONTENT = /<(script|style)\b[\s\S]*$/i;
const HREF_ATTR = /\shref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i;
// What may follow "<" for it to be markup rather than a typed angle bracket.
const TAG_NAME = /^\/?[a-z][a-z0-9-]*/i;

/**
 * Reduce stored note HTML to the tags the app renders. The viewer's WebView
 * runs with JavaScript disabled behind a `default-src 'none'` CSP, so this is
 * the second layer rather than the only one — but it also keeps a note authored
 * by a future (or malicious) client from rendering as anything but a note.
 */
export function sanitizeNoteHtml(html: string): string {
  const withoutRaw = html
    .replace(RAW_CONTENT_BLOCK, "")
    .replace(UNCLOSED_RAW_CONTENT, "");

  let out = "";
  let index = 0;
  const openAnchors: boolean[] = [];

  while (index < withoutRaw.length) {
    const start = withoutRaw.indexOf("<", index);
    if (start === -1) {
      out += withoutRaw.slice(index);
      break;
    }
    out += withoutRaw.slice(index, start);

    const end = withoutRaw.indexOf(">", start);
    const raw = end === -1 ? "" : withoutRaw.slice(start + 1, end);
    if (end === -1 || !TAG_NAME.test(raw)) {
      // Not a tag — a stray "<" the author typed. Keep it as escaped text so it
      // reads as written instead of swallowing the rest of the line.
      out += "&lt;";
      index = start + 1;
      continue;
    }

    const isClosing = raw.startsWith("/");
    const name = (isClosing ? raw.slice(1) : raw)
      .split(/[\s/]/)[0]
      .toLowerCase();

    if (ALLOWED_TAGS.has(name)) {
      out += renderTag(name, raw, isClosing, openAnchors);
    }
    index = end + 1;
  }

  return out;
}

/** Emit an allowlisted tag stripped of every attribute but a safe `<a href>`. */
function renderTag(
  name: string,
  raw: string,
  isClosing: boolean,
  openAnchors: boolean[],
): string {
  if (name === "br") {
    return "<br>";
  }
  if (name !== "a") {
    return isClosing ? `</${name}>` : `<${name}>`;
  }
  if (isClosing) {
    // Only close anchors we actually opened, so a dropped link can't leave a
    // stray `</a>` that unbalances the document.
    return openAnchors.pop() === true ? "</a>" : "";
  }

  const match = HREF_ATTR.exec(raw);
  const href = match ? (match[2] ?? match[3] ?? match[4] ?? "") : "";
  if (!SAFE_HREF.test(href)) {
    openAnchors.push(false);
    return "";
  }
  openAnchors.push(true);
  return `<a href="${escapeHref(href)}">`;
}

/**
 * Make an href safe to re-emit inside double quotes. Unlike `escapeHtml` this
 * leaves `&` alone: the stored href already carries encoded entities (`&amp;`
 * between query parameters), and escaping them again would corrupt the URL.
 */
function escapeHref(href: string): string {
  return href
    .trim()
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
