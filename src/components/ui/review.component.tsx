import imageCompression from "browser-image-compression";
import { FileIcon, Image as ImageIcon, Paperclip, Star, X } from "lucide-react";
import type { RecordModel } from "pocketbase";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { gameImage } from "@/api/client.api";
import GamesApi from "@/api/games.api";
import Editor from "@/components/shared/editor.lazy";
import { Image } from "@/components/shared/image.component";
import { Button } from "@/components/ui/button.component";
import { SmallLoader } from "@/components/ui/loader.components";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/modal.component";

type EditReviewDialogProps = {
  game: RecordModel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

export default function EditReviewDialog({
  game,
  open,
  onOpenChange,
  onUpdated,
}: Readonly<EditReviewDialogProps>) {
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [is3DModel, setIs3DModel] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);
  const [removeText, setRemoveText] = useState(false);

  const getTextLength = useCallback((html: string): number => {
    if (!html) return 0;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent?.length || 0;
  }, []);

  const textLength = useMemo(
    () => getTextLength(reviewText),
    [reviewText, getTextLength],
  );

  useEffect(() => {
    if (open) {
      setReviewText(game.reviewText || "");
      setReviewRating(game.reviewRating || 0);
      setFile(null);
      setPreview(null);
      setIs3DModel(false);
      setRemoveImage(false);
      setRemoveText(false);
    }
  }, [open, game.reviewText, game.reviewRating]);

  const compressionOptions = useMemo(
    () => ({
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/webp",
    }),
    [],
  );

  const compressImage = useCallback(
    async (f: File): Promise<File> => {
      if (f.type === "image/gif") return f;

      const compressed = (await imageCompression(
        f,
        compressionOptions,
      )) as Blob;
      const base = `${f.name.replace(/\.[^.]+$/, "")}.webp` as string;

      const file: File = new File([compressed], base, {
        type: "image/webp",
        lastModified: Date.now(),
      });

      return file;
    },
    [compressionOptions],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles?.length) return;
      const f = acceptedFiles[0];
      const isImage = f.type.startsWith("image/");

      if (!isImage) return;

      setUploading(true);
      try {
        const c = await compressImage(f);
        setFile(c);
        setIs3DModel(false);
        setRemoveImage(false);
        const url = URL.createObjectURL(c);
        setPreview(url);
      } finally {
        setUploading(false);
      }
    },
    [compressImage],
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFileDialog,
  } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: false,
    noClick: true,
  });

  const clearFile = useCallback(() => {
    const hadNewFile = !!file;
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setIs3DModel(false);
    if (hadNewFile && game.reviewImage) {
      setRemoveImage(false);
    } else if (!hadNewFile && game.reviewImage) {
      setRemoveImage(true);
    }
  }, [preview, file, game.reviewImage]);

  const reset = useCallback(() => {
    setReviewText(game.reviewText || "");
    setReviewRating(game.reviewRating || 0);
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setIs3DModel(false);
    setRemoveImage(false);
    setRemoveText(false);
  }, [game.reviewText, game.reviewRating, preview]);

  const handleSubmit = useCallback(async () => {
    if (!removeText && reviewText.trim()) {
      const actualTextLength = getTextLength(reviewText.trim());
      if (actualTextLength > 1000) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: {
        reviewText?: string | null;
        reviewRating?: number | null;
        reviewImage?: File | null | string;
      } = {};

      if (removeText) {
        payload.reviewText = null;
      } else if (reviewText.trim()) {
        payload.reviewText = reviewText.trim();
      }

      if (reviewRating > 0) {
        payload.reviewRating = reviewRating;
      } else if (game.reviewRating) {
        payload.reviewRating = null;
      }

      if (removeImage) {
        payload.reviewImage = null;
      } else if (file) {
        payload.reviewImage = file;
      }

      await new GamesApi().updateGame(
        game.id,
        payload as unknown as Record<string, unknown>,
      );

      onOpenChange(false);
      onUpdated?.();
      reset();
    } finally {
      setSubmitting(false);
    }
  }, [
    game.id,
    game.reviewRating,
    reviewText,
    reviewRating,
    file,
    removeImage,
    removeText,
    onOpenChange,
    onUpdated,
    reset,
    getTextLength,
  ]);

  const existingImageUrl =
    game.reviewImage && !removeImage && !file
      ? `${gameImage}${game.id}/${game.reviewImage}`
      : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent
        {...getRootProps()}
        className={`${
          isDragActive
            ? "bg-primary/5 border-2 border-primary border-dashed text-primary"
            : "border border-primary text-primary"
        }`}
      >
        <DialogHeader>
          <DialogTitle>Редактировать отзыв</DialogTitle>
          <DialogDescription>
            Измените текст, изображение или рейтинг отзыва
          </DialogDescription>
        </DialogHeader>

        {isDragActive && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center z-50 rounded border-2 border-dashed border-primary pointer-events-none">
            <div className="text-center bg-background p-6 rounded shadow-lg border border-border">
              <ImageIcon className="mx-auto h-12 w-12 text-primary mb-2" />
              <p className="text-lg font-semibold text-primary">
                Переместите файл сюда
              </p>
            </div>
          </div>
        )}

        <input {...getInputProps()} />

        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 self-center">
            {new Array(5).fill(0).map((_, idx) => {
              const active = idx < reviewRating;
              return (
                <button
                  key={idx.toString()}
                  type="button"
                  className="p-1"
                  onClick={() => setReviewRating(idx + 1)}
                  aria-label={`Оценка ${idx + 1}`}
                >
                  <Star
                    className="w-7 h-7"
                    style={{ fill: active ? "var(--color-primary)" : "" }}
                  />
                </button>
              );
            })}
          </div>

          <div className="w-full">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 items-start">
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-10 min-w-10 border border-input rounded items-center justify-center text-center flex hover:bg-accent hover:text-accent-foreground"
                  onClick={openFileDialog}
                  disabled={uploading || removeText}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Editor
                    content={removeText ? "" : reviewText}
                    onChange={(e) => {
                      setReviewText(e);
                      setRemoveText(false);
                    }}
                    placeholder="Напишите отзыв..."
                    editable={!removeText}
                    className="border-primary"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-primary/70">{textLength}/1000</div>
                {game.reviewText && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6"
                    onClick={() => {
                      setRemoveText(!removeText);
                      if (removeText) {
                        setReviewText(game.reviewText || "");
                      } else {
                        setReviewText("");
                      }
                    }}
                  >
                    {removeText ? "Восстановить текст" : "Удалить текст"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {uploading && (
            <div className="flex items-center gap-3 p-2 bg-background rounded border border-border w-full">
              <SmallLoader />
              <span className="text-sm text-primary">Обработка файла…</span>
            </div>
          )}

          {existingImageUrl && !removeImage && !file && (
            <div className="flex items-center gap-2 p-2 bg-background rounded border border-border w-full">
              <div className="relative">
                <Image
                  src={existingImageUrl}
                  className="h-16 w-16 object-cover rounded border border-border"
                  loading="lazy"
                  alt="current review image"
                />
                <Button
                  variant="ghost"
                  onClick={clearFile}
                  className="absolute -top-2 -right-2 bg-background hover:bg-background rounded border size-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <span className="text-sm text-primary flex-1 truncate">
                {game.reviewImage}
              </span>
            </div>
          )}

          {file && (
            <div className="flex items-center gap-2 p-2 bg-background rounded border border-border w-full">
              <div className="relative">
                {is3DModel ? (
                  <div className="h-16 w-16 flex items-center justify-center rounded border border-border bg-background">
                    <FileIcon className="h-8 w-8 text-primary" />
                  </div>
                ) : (
                  preview && (
                    <Image
                      src={preview}
                      className="h-16 w-16 object-cover rounded border border-border"
                      loading="lazy"
                      alt="new preview"
                    />
                  )
                )}
                <Button
                  variant="ghost"
                  onClick={clearFile}
                  className="absolute -top-2 -right-2 bg-background hover:bg-background rounded border size-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <span className="text-sm text-primary flex-1 truncate">
                <span className="text-sm text-primary flex-1 truncate">
                  {"Изображение." +
                    file?.name.split(".")[file?.name.split.length - 1]}
                </span>
              </span>
            </div>
          )}
        </section>

        <DialogFooter>
          <Button
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
            disabled={submitting}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || (!removeText && textLength > 1000)}
          >
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
