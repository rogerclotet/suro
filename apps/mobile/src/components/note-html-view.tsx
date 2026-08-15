import * as WebBrowser from "expo-web-browser";
import { useMemo } from "react";
import { Linking } from "react-native";
import { WebView } from "react-native-webview";
import { sanitizeNoteHtml, toEditorHtml } from "@/lib/note-content";
import { richTextCss } from "@/lib/note-css";
import { type Theme, useTheme } from "@/theme";

// Schemes we hand to the OS instead of the WebView when a link is tapped.
const EXTERNAL_SCHEME = /^(https?|mailto|tel):/i;

/**
 * The read-only note surface: the stored note rendered as HTML, styled like the
 * editor (and like the web's `.rich-text`), with links that open outside the
 * app instead of navigating the WebView.
 *
 * The document runs with JavaScript disabled behind a `default-src 'none'` CSP
 * and its markup is allowlist-sanitized first, so a note can only ever render
 * as text — never as script, an iframe or a remote request.
 */
export function NoteHtmlView({
  contents,
  format,
}: {
  contents: string;
  format: string;
}) {
  const t = useTheme();
  const html = useMemo(
    () => documentHtml(sanitizeNoteHtml(toEditorHtml(contents, format)), t),
    [contents, format, t],
  );

  return (
    <WebView
      // Navigation is gated by `onShouldStartLoadWithRequest` below; the
      // whitelist only has to let the inlined document itself load.
      originWhitelist={["*"]}
      source={{ html }}
      javaScriptEnabled={false}
      onShouldStartLoadWithRequest={(request) => {
        if (EXTERNAL_SCHEME.test(request.url)) {
          openExternally(request.url);
          return false;
        }
        // The inlined document (about:blank / data:) — nothing else can reach
        // here, so anything unrecognized stays blocked.
        return request.url === "about:blank" || request.url.startsWith("data:");
      }}
      style={{ flex: 1, backgroundColor: t.bg }}
      // Keep the page at its own scale: notes are text, not a desktop layout.
      scalesPageToFit={false}
      showsVerticalScrollIndicator={false}
    />
  );
}

function openExternally(url: string): void {
  if (/^https?:/i.test(url)) {
    void WebBrowser.openBrowserAsync(url);
    return;
  }
  void Linking.openURL(url);
}

function documentHtml(body: string, t: Theme): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:;">
    <style>
      html { -webkit-text-size-adjust: 100%; background-color: ${t.bg}; }
      body { margin: 0; word-wrap: break-word; overflow-wrap: break-word; }
      ${richTextCss(t, "body")}
    </style>
  </head>
  <body>${body}</body>
</html>`;
}
