import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo,
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
}

function Editor({
  content = "",
  onChange,
  placeholder = "Напишите отзыв...",
  editable = true,
  className,
}: Readonly<SimpleEditorProps>) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
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
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
      disabled: !editor.can().chain().focus().toggleBold().run(),
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
      disabled: !editor.can().chain().focus().toggleItalic().run(),
    },
    {
      icon: Heading1,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      active: editor.isActive("heading", { level: 1 }),
    },
    {
      icon: Heading2,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
    },
    {
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
    {
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
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
