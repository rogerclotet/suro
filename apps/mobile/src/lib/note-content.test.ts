import { describe, expect, it } from "vitest";
import {
  isBlankHtml,
  notePreview,
  sanitizeNoteHtml,
  toEditorHtml,
} from "./note-content";

describe("notePreview", () => {
  it("tidies plain text and collapses blank-line runs", () => {
    expect(notePreview("  hello   world  ", "plain")).toBe("hello world");
    expect(notePreview("a\n\n\n\nb", "plain")).toBe("a\n\nb");
  });

  it("strips HTML to text, turning blocks into line breaks", () => {
    expect(notePreview("<p>First</p><p>Second</p>", "html")).toBe(
      "First\nSecond",
    );
    expect(notePreview("<h2>Title</h2><p>Body here</p>", "html")).toBe(
      "Title\nBody here",
    );
  });

  it("flattens lists and respects <br> breaks", () => {
    expect(notePreview("<ul><li>one</li><li>two</li></ul>", "html")).toBe(
      "one\ntwo",
    );
    expect(notePreview("<p>line<br>break</p>", "html")).toBe("line\nbreak");
  });

  it("decodes entities and drops inline formatting tags", () => {
    expect(
      notePreview("<p>Tom <strong>&amp;</strong> Jerry &lt;3</p>", "html"),
    ).toBe("Tom & Jerry <3");
    expect(notePreview("<p>a&nbsp;&nbsp;b</p>", "html")).toBe("a b");
  });

  it("returns an empty string for empty editor HTML", () => {
    expect(notePreview("<p></p>", "html")).toBe("");
    expect(notePreview("", "html")).toBe("");
  });
});

describe("toEditorHtml", () => {
  it("passes HTML notes through untouched", () => {
    const html = "<h2>Hi</h2><p>there</p>";
    expect(toEditorHtml(html, "html")).toBe(html);
  });

  it("wraps plain lines in paragraphs and escapes HTML", () => {
    expect(toEditorHtml("a\nb", "plain")).toBe("<p>a</p><p>b</p>");
    expect(toEditorHtml("1 < 2 & 3 > 0", "plain")).toBe(
      "<p>1 &lt; 2 &amp; 3 &gt; 0</p>",
    );
  });

  it("returns an empty string for blank plain notes", () => {
    expect(toEditorHtml("", "plain")).toBe("");
    expect(toEditorHtml("   \n  ", "plain")).toBe("");
  });

  it("round-trips a plain note into HTML and back to a preview", () => {
    const html = toEditorHtml("shopping\nmilk", "plain");
    expect(notePreview(html, "html")).toBe("shopping\nmilk");
  });
});

describe("sanitizeNoteHtml", () => {
  it("keeps the tags the editors produce", () => {
    const html =
      "<h2>Title</h2><p><strong>bold</strong> <em>it</em> <s>gone</s><br>next</p><ul><li>one</li></ul><blockquote>q</blockquote>";
    expect(sanitizeNoteHtml(html)).toBe(html);
  });

  it("drops disallowed tags but keeps their text", () => {
    expect(sanitizeNoteHtml("<p><span class='x'>hi</span></p>")).toBe(
      "<p>hi</p>",
    );
    expect(sanitizeNoteHtml('<p>a<img src="x" onerror="alert(1)">b</p>')).toBe(
      "<p>ab</p>",
    );
  });

  it("removes script and style blocks entirely", () => {
    expect(sanitizeNoteHtml("<p>a</p><script>alert(1)</script><p>b</p>")).toBe(
      "<p>a</p><p>b</p>",
    );
    expect(sanitizeNoteHtml("<style>body{}</style><p>a</p>")).toBe("<p>a</p>");
    expect(sanitizeNoteHtml("<p>a</p><script>alert(1)")).toBe("<p>a</p>");
  });

  it("strips attributes from everything but a link's href", () => {
    expect(sanitizeNoteHtml('<p class="x" onclick="steal()">hi</p>')).toBe(
      "<p>hi</p>",
    );
    expect(
      sanitizeNoteHtml(
        '<a href="https://a.test?x=1&amp;y=2" onclick="steal()">l</a>',
      ),
    ).toBe('<a href="https://a.test?x=1&amp;y=2">l</a>');
  });

  it("unwraps links with an unsafe scheme, keeping their text", () => {
    expect(sanitizeNoteHtml('<a href="javascript:alert(1)">tap</a>')).toBe(
      "tap",
    );
    expect(sanitizeNoteHtml("<p>a<a>bare</a>b</p>")).toBe("<p>abareb</p>");
    expect(sanitizeNoteHtml('<a href="mailto:a@b.test">mail</a>')).toBe(
      '<a href="mailto:a@b.test">mail</a>',
    );
  });

  it("escapes a stray angle bracket instead of emitting markup", () => {
    expect(sanitizeNoteHtml("<p>2 < 3</p>")).toBe("<p>2 &lt; 3</p>");
  });
});

describe("isBlankHtml", () => {
  it("treats empty Tiptap documents as blank", () => {
    expect(isBlankHtml("<p></p>")).toBe(true);
    expect(isBlankHtml("<p><br></p>")).toBe(true);
    expect(isBlankHtml("   ")).toBe(true);
  });

  it("treats real content as non-blank", () => {
    expect(isBlankHtml("<p>x</p>")).toBe(false);
  });
});
