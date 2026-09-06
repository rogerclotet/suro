import {
  CoreBridge,
  type EditorBridge,
  RichText,
  TenTapStartKit,
  useBridgeState,
  useEditorBridge,
  useEditorContent,
} from "@10play/tentap-editor";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react-native";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useTranslations } from "@/i18n";
import { richTextCss } from "@/lib/note-css";
import { type Theme, useTheme } from "@/theme";
import { Button, Field, Sheet, Txt } from "@/ui";

type BridgeState = ReturnType<typeof useBridgeState>;

/**
 * The notes rich-text editing surface: a themed formatting toolbar above a
 * Tiptap WebView (via tentap, so it emits the same HTML as the web app).
 * The owning screen passes the HTML captured when it acquired the editing lock
 * as `content` and receives local edits through `onChangeHtml`. The draft stays
 * local for this editing session, including after a lost lock.
 * Expects a flex parent so the editor fills the space below the toolbar.
 */
export function NoteRichEditor({
  content,
  placeholder,
  onChangeHtml,
  editable = true,
}: {
  content: string;
  placeholder: string;
  onChangeHtml?: (html: string) => void;
  editable?: boolean;
}) {
  const t = useTheme();
  const editor = useEditorBridge({
    // Bake the theme CSS into the editor's initial HTML so the text renders in
    // the right color from the first paint — injecting it later (on `isReady`)
    // leaves a flash of default-black text on the dark background until focus.
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(editorCss(t)),
    ],
    initialContent: content,
    avoidIosKeyboard: true,
    theme: {
      webview: { backgroundColor: t.bg },
      webviewContainer: { backgroundColor: t.bg },
    },
  });
  const editorState = useBridgeState(editor);
  const html = useEditorContent(editor, { type: "html" });
  useEffect(() => {
    if (editorState.isReady) editor.setEditable(editable);
  }, [editorState.isReady, editor, editable]);

  // Re-skin the in-webview document to the app's warm theme once it's ready and
  // whenever the scheme flips.
  useEffect(() => {
    if (editorState.isReady) {
      editor.injectCSS(editorCss(t), "suro-theme");
      editor.setPlaceholder(placeholder);
    }
  }, [editorState.isReady, editor, t, placeholder]);

  const onChangeRef = useRef(onChangeHtml);
  onChangeRef.current = onChangeHtml;
  useEffect(() => {
    if (html !== undefined) onChangeRef.current?.(html);
  }, [html]);

  return (
    <>
      {editable && <EditorToolbar editor={editor} state={editorState} />}
      <RichText editor={editor} style={{ flex: 1, backgroundColor: t.bg }} />
    </>
  );
}

function EditorToolbar({
  editor,
  state,
}: {
  editor: EditorBridge;
  state: BridgeState;
}) {
  const t = useTheme();
  const [linkOpen, setLinkOpen] = useState(false);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        backgroundColor: t.card,
      }}
    >
      <ScrollView
        horizontal
        keyboardShouldPersistTaps="always"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: "center",
          gap: 2,
          paddingHorizontal: 6,
          paddingVertical: 6,
        }}
      >
        <ToolBtn
          label="bold"
          active={state.isBoldActive}
          onPress={() => editor.toggleBold()}
        >
          <Bold {...iconProps(t, state.isBoldActive)} />
        </ToolBtn>
        <ToolBtn
          label="italic"
          active={state.isItalicActive}
          onPress={() => editor.toggleItalic()}
        >
          <Italic {...iconProps(t, state.isItalicActive)} />
        </ToolBtn>
        <ToolBtn
          label="strike"
          active={state.isStrikeActive}
          onPress={() => editor.toggleStrike()}
        >
          <Strikethrough {...iconProps(t, state.isStrikeActive)} />
        </ToolBtn>
        <Divider />
        <ToolBtn
          label="heading2"
          active={state.headingLevel === 2}
          onPress={() => editor.toggleHeading(2)}
        >
          <Heading2 {...iconProps(t, state.headingLevel === 2)} />
        </ToolBtn>
        <ToolBtn
          label="heading3"
          active={state.headingLevel === 3}
          onPress={() => editor.toggleHeading(3)}
        >
          <Heading3 {...iconProps(t, state.headingLevel === 3)} />
        </ToolBtn>
        <Divider />
        <ToolBtn
          label="bulletList"
          active={state.isBulletListActive}
          onPress={() => editor.toggleBulletList()}
        >
          <List {...iconProps(t, state.isBulletListActive)} />
        </ToolBtn>
        <ToolBtn
          label="orderedList"
          active={state.isOrderedListActive}
          onPress={() => editor.toggleOrderedList()}
        >
          <ListOrdered {...iconProps(t, state.isOrderedListActive)} />
        </ToolBtn>
        <ToolBtn
          label="blockquote"
          active={state.isBlockquoteActive}
          onPress={() => editor.toggleBlockquote()}
        >
          <Quote {...iconProps(t, state.isBlockquoteActive)} />
        </ToolBtn>
        <Divider />
        <ToolBtn
          label="link"
          active={state.isLinkActive}
          disabled={!state.canSetLink && !state.isLinkActive}
          onPress={() => setLinkOpen(true)}
        >
          <LinkIcon {...iconProps(t, state.isLinkActive)} />
        </ToolBtn>
        <Divider />
        <ToolBtn
          label="undo"
          disabled={!state.canUndo}
          onPress={() => editor.undo()}
        >
          <Undo2 {...iconProps(t, false, !state.canUndo)} />
        </ToolBtn>
        <ToolBtn
          label="redo"
          disabled={!state.canRedo}
          onPress={() => editor.redo()}
        >
          <Redo2 {...iconProps(t, false, !state.canRedo)} />
        </ToolBtn>
      </ScrollView>
      <LinkSheet
        visible={linkOpen}
        initial={state.activeLink ?? ""}
        onClose={() => setLinkOpen(false)}
        onApply={(href) => {
          editor.setLink(href);
          setLinkOpen(false);
        }}
      />
    </View>
  );
}

function iconProps(t: Theme, active: boolean, disabled = false) {
  return {
    size: 20,
    color: disabled ? t.muted : active ? t.onPrimary : t.text,
  };
}

function ToolBtn({
  label,
  active,
  disabled,
  onPress,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  const t = useTheme();
  const tEditor = useTranslations("mobile.notes.editor");
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      accessibilityLabel={tEditor(label)}
      style={{
        width: 38,
        height: 38,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? t.primary : "transparent",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </Pressable>
  );
}

function Divider() {
  const t = useTheme();
  return (
    <View
      style={{
        width: 1,
        height: 22,
        marginHorizontal: 4,
        backgroundColor: t.border,
      }}
    />
  );
}

function LinkSheet({
  visible,
  initial,
  onClose,
  onApply,
}: {
  visible: boolean;
  initial: string;
  onClose: () => void;
  onApply: (href: string | null) => void;
}) {
  const tEditor = useTranslations("mobile.notes.editor");
  const [url, setUrl] = useState(initial);

  // Reset the field to the active link each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setUrl(initial);
    }
  }, [visible, initial]);

  function apply() {
    const trimmed = url.trim();
    if (trimmed === "") {
      onApply(null);
      return;
    }
    onApply(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {tEditor("link")}
      </Txt>
      <Field
        placeholder={tEditor("linkPlaceholder")}
        value={url}
        onChangeText={setUrl}
        autoFocus
        autoCapitalize="none"
        keyboardType="url"
        inputMode="url"
        onSubmitEditing={apply}
      />
      <Button title={tEditor("linkApply")} onPress={apply} />
      {initial !== "" ? (
        <Button
          title={tEditor("unlink")}
          variant="ghost"
          onPress={() => onApply(null)}
        />
      ) : null}
    </Sheet>
  );
}

/** CSS injected into the editor's WebView so it matches the active app theme. */
function editorCss(t: Theme): string {
  return `
    ${richTextCss(t, ".ProseMirror")}
    .ProseMirror { caret-color: ${t.primary}; }
    .ProseMirror p.is-editor-empty:first-child::before {
      color: ${t.muted};
      content: attr(data-placeholder);
      float: left;
      height: 0;
      pointer-events: none;
    }
  `;
}
