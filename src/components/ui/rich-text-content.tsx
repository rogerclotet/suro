import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";

const ALLOWED_TAGS = [
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
];

const ALLOWED_ATTR = ["href", "target", "rel"];

function sanitize(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

export function RichTextContent({
  format,
  content,
  className,
}: {
  format: string;
  content: string;
  className?: string;
}) {
  if (format === "html") {
    return (
      <div
        className={cn("rich-text", className)}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized via DOMPurify above before render
        dangerouslySetInnerHTML={{ __html: sanitize(content) }}
      />
    );
  }

  return <p className={cn("whitespace-pre-line", className)}>{content}</p>;
}

const BLOCK_BREAK_TAGS = new Set(["p", "h2", "h3", "blockquote", "li"]);

export function htmlToPreview(format: string, content: string): string {
  if (format !== "html") {
    return content;
  }

  let result = "";
  const listStack: { type: "ul" | "ol"; counter: number }[] = [];
  let i = 0;

  while (i < content.length) {
    const ch = content[i];

    if (ch !== "<") {
      result += ch;
      i++;
      continue;
    }

    const end = content.indexOf(">", i);
    if (end === -1) break;

    const raw = content.slice(i + 1, end).trim();
    const isClosing = raw.startsWith("/");
    const tagName = (isClosing ? raw.slice(1) : raw)
      .split(/[\s/]/)[0]
      ?.toLowerCase();

    if (tagName === "br") {
      result += "\n";
    } else if (tagName === "ul" || tagName === "ol") {
      if (isClosing) {
        listStack.pop();
      } else {
        listStack.push({ type: tagName, counter: 0 });
      }
    } else if (tagName === "li" && !isClosing) {
      const top = listStack[listStack.length - 1];
      if (!result.endsWith("\n") && result.length > 0) result += "\n";
      if (top?.type === "ol") {
        top.counter += 1;
        result += `${top.counter}. `;
      } else {
        result += "• ";
      }
    } else if (isClosing && tagName && BLOCK_BREAK_TAGS.has(tagName)) {
      result += "\n";
    }

    i = end + 1;
  }

  return result
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
