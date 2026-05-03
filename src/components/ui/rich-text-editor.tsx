"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
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
  Unlink,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  ariaLabel,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        horizontalRule: false,
        underline: false,
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            rel: "noopener noreferrer nofollow",
            target: "_blank",
          },
        },
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-text px-3 py-2",
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  return (
    <div
      className={cn(
        "rich-text-editor rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className,
      )}
    >
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  const t = useTranslations("notes.editor");

  if (!editor) {
    return <div className="h-10 border-input border-b" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-input border-b p-1">
      <ToolbarButton
        label={t("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={t("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={t("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        label={t("heading2")}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={t("heading3")}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
      >
        <Heading3 className="size-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        label={t("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={t("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={t("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
      >
        <Quote className="size-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      <LinkButton editor={editor} />
      <ToolbarButton
        label={t("unlink")}
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive("link")}
      >
        <Unlink className="size-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        label={t("undo")}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={t("redo")}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo2 className="size-4" />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(active && "bg-accent text-accent-foreground")}
    >
      {children}
    </Button>
  );
}

function ToolbarSeparator() {
  return <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />;
}

function LinkButton({ editor }: { editor: Editor }) {
  const t = useTranslations("notes.editor");
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const inputId = useId();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    }
  }

  function handleApply() {
    const trimmed = url.trim();
    if (trimmed === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      const href = /^https?:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("link")}
          title={t("link")}
          className={cn(
            editor.isActive("link") && "bg-accent text-accent-foreground",
          )}
        >
          <LinkIcon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-2 p-3">
        <label
          htmlFor={inputId}
          className="block font-medium text-muted-foreground text-xs"
        >
          {t("link")}
        </label>
        <Input
          id={inputId}
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t("linkPlaceholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApply();
            }
          }}
        />
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={handleApply}>
            {t("linkApply")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
