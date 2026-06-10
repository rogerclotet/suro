import { describe, expect, it } from "vitest";
import { isBlankHtml, notePreview, toEditorHtml } from "./note-content";

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
