// @vitest-environment node
// Node, not jsdom: server rendering runs isomorphic-dompurify's own jsdom.
import { describe, expect, it } from "vitest";
import { sanitizeRichText } from "./sanitize-rich-text";

describe("sanitizeRichText", () => {
  it("keeps the formatting tags the editors produce", () => {
    const html =
      "<h2>Title</h2><p><strong>a</strong> <em>b</em> <s>c</s></p><ul><li>x</li></ul>";
    expect(sanitizeRichText(html)).toBe(html);
  });

  it("drops scripts, event handlers and disallowed tags", () => {
    expect(
      sanitizeRichText(
        '<p onclick="alert(1)">hi<script>alert(1)</script><img src=x onerror="alert(1)"></p>',
      ),
    ).toBe("<p>hi</p>");
  });

  it("forces safe-window attributes on links", () => {
    expect(
      sanitizeRichText('<a href="https://example.com" target="_self">x</a>'),
    ).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">x</a>',
    );
  });

  it("strips javascript: hrefs", () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).toBe(
      "<a>x</a>",
    );
  });
});
