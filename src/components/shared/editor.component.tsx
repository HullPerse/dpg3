import Bold from "@tiptap/extension-bold";
import Document from "@tiptap/extension-document";
import Image from "@tiptap/extension-image";
import Italic from "@tiptap/extension-italic";
import Paragraph from "@tiptap/extension-paragraph";
import Strike from "@tiptap/extension-strike";
import Text from "@tiptap/extension-text";
import Underline from "@tiptap/extension-underline";
import { UndoRedo } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";

import {
  BoldIcon,
  Image as ImageIcon,
  ItalicIcon,
  Redo,
  Strikethrough,
  UnderlineIcon,
  Undo,
} from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button.component";
import { Separator } from "@/components/ui/separator.component";
import { Toggle } from "@/components/ui/toggle.component";
import { cn } from "@/lib/utils";

interface SimpleEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  onImagePaste?: (file: File) => void;
}

function Editor({
  content = "",
  onChange,
  placeholder = "Напишите отзыв...",
  editable = true,
  className,
  onImagePaste,
}: Readonly<SimpleEditorProps>) {
  const editor = useEditor({
    extensions: [
      Bold,
      Document,
      Italic,
      Paragraph,
      Text,
      Underline,
      Strike,
      Image,
      UndoRedo,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      handlePaste: (_, event) => {
        const items = Array.from(event.clipboardData?.items || []);

        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();

            const file = item.getAsFile();
            if (!file) continue;

            // If parent component handles image paste, delegate to it
            if (onImagePaste) {
              onImagePaste(file);
              return true;
            }

            return false;
          }
        }

        return false;
      },
      attributes: {
        class: cn(
          "min-h-[150px] w-full p-4 focus:outline-none",
          "prose prose-sm max-w-none",
          "text-foreground placeholder:text-muted-foreground",
          "break-words overflow-wrap-anywhere whitespace-pre-wrap",
        ),
        placeholder,
      },
    },
  });

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onImagePaste) {
        onImagePaste(file);
      }
    };
    input.click();
  };
  if (!editor) {
    return (
      <div
        className={cn(
          "border rounded bg-background min-h-[150px] p-4",
          className,
        )}
      >
        <div className="text-muted-foreground">{placeholder}</div>
      </div>
    );
  }

  const toolbarItems = [
    {
      icon: BoldIcon,
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
      disabled: !editor.can().chain().focus().toggleBold().run(),
    },
    {
      icon: ItalicIcon,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
      disabled: !editor.can().chain().focus().toggleItalic().run(),
    },
    {
      icon: UnderlineIcon,
      action: () => editor.chain().focus().toggleUnderline().run(),
      active: editor.isActive("underline"),
    },
    {
      icon: Strikethrough,
      action: () => editor.chain().focus().toggleStrike().run(),
      active: editor.isActive("strike"),
    },
    {
      icon: ImageIcon,
      action: handleImageUpload,
      active: false,
    },
  ];

  const utilityItems = [
    {
      icon: Undo,
      action: () => editor.chain().focus().undo().run(),
      disabled: !editor.can().chain().focus().undo().run(),
    },
    {
      icon: Redo,
      action: () => editor.chain().focus().redo().run(),
      disabled: !editor.can().chain().focus().redo().run(),
    },
  ];

  return (
    <div
      className={cn(
        "border rounded bg-background w-full",
        "max-w-full overflow-hidden",
        className,
      )}
    >
      {/* Toolbar */}
      <div className="border-b p-2 bg-muted/30">
        <div className="flex flex-wrap items-center gap-1">
          <div className="flex items-center gap-1 flex-wrap">
            {toolbarItems.map((item, index) => (
              <Toggle
                key={index.toString()}
                size="sm"
                pressed={item.active}
                onPressedChange={item.action}
                disabled={item.disabled}
                className={cn(
                  "h-8 w-8 p-0 cursor-pointer transition-colors",
                  item.active && "bg-primary/30 text-secondary",
                  "hover:bg-primary/70 hover:text-secondary",
                  item.disabled &&
                    "opacity-50 cursor-not-allowed hover:bg-transparent",
                )}
              >
                <item.icon className="h-4 w-4" />
              </Toggle>
            ))}
          </div>

          <Separator orientation="vertical" className="h-4 mx-1" />

          <div className="flex items-center gap-1">
            {utilityItems.map((item, index) => (
              <Button
                key={index.toString()}
                variant="ghost"
                size="sm"
                onClick={item.action}
                disabled={item.disabled}
                className={cn(
                  "h-8 w-8 p-0 cursor-pointer transition-colors",
                  "hover:bg-primary/70 hover:text-primary-foreground",
                  item.disabled &&
                    "opacity-50 cursor-not-allowed hover:bg-transparent",
                )}
              >
                <item.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-full overflow-hidden">
        <EditorContent editor={editor} className="max-w-full" />
      </div>
    </div>
  );
}

export default memo(Editor);
