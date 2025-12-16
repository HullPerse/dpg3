import imageCompression from "browser-image-compression";
import { FileIcon, Image as ImageIcon, Paperclip, Star, X } from "lucide-react";
import type { RecordModel } from "pocketbase";
import { memo, useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import GamesApi from "@/api/games.api";
import ItemsApi from "@/api/items.api";
import LogsApi from "@/api/logs.api";
import UsersApi from "@/api/users.api";
import { Image } from "@/components/shared/image.component";
import { Button } from "@/components/ui/button.component";
import { SmallLoader } from "@/components/ui/loader.components";
import Editor from "@/components/shared/editor.component";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/modal.component";
import { poopReview } from "@/config/items.config";
import { gameRewards } from "@/lib/utils";
import { useLoginStore } from "@/store/login.store";
import type { StatusType } from "@/types/games";
import type { LogType } from "@/types/log";

type GameStatusProps = {
  game: RecordModel;
  targetStatus: StatusType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

const gamesApi = new GamesApi();
const usersApi = new UsersApi();
const itemsApi = new ItemsApi();
const logsApi = new LogsApi();

function GameStatus({
  game,
  targetStatus,
  open,
  onOpenChange,
  onUpdated,
}: Readonly<GameStatusProps>) {
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [is3DModel, setIs3DModel] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const user = useLoginStore((state) => state.user);

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
      "model/fbx": [".fbx"],
    },
    multiple: false,
    noClick: true,
  });

  const clearFile = useCallback(() => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setIs3DModel(false);
  }, [preview]);

  const reset = useCallback(() => {
    setReviewText("");
    setReviewRating(0);
    clearFile();
  }, [clearFile]);

  const handleSubmit = useCallback(async () => {
    if (reviewText.trim()) {
      const actualTextLength = getTextLength(reviewText.trim());
      if (actualTextLength > 1000) {
        return;
      }
    }

    setSubmitting(true);
    try {
      let finalText = reviewText.trim();
      const isPoopReview = await usersApi.itemAvailability(
        poopReview,
        String(user?.id),
      );

      if (isPoopReview) {
        finalText = `💩💩💩 ${finalText} 💩💩💩`;

        const poopReviewId = await itemsApi
          .getInventory(String(user?.id))
          .then((res) => res.find((item) => item.itemId === poopReview));

        if (poopReviewId)
          await usersApi.removeItem(
            poopReviewId.id,
            user?.id,
            poopReviewId.image,
            poopReviewId.label,
          );
      }

      await gamesApi.updateGame(game.id, {
        status: targetStatus,
        reviewText: finalText || undefined,
        reviewRating: reviewRating || undefined,
        reviewImage: file || undefined,
      });

      if (targetStatus === "COMPLETED") {
        if (!user) return;

        await usersApi.changeMoney(user.id, gameRewards(game.data.time));
      }

      if (user) {
        const logData: LogType = {
          username: user.username.toUpperCase(),
          type: "gameStatus",
          image: game.data.image,
        };

        await usersApi.changePooped(user.id, false);

        await logsApi.createLog({
          type: logData.type,
          sender: {
            id: user.id,
            username: user.username.toUpperCase(),
          },
          label: game.data.title,
          image: game.data.image,
        });
      }

      onOpenChange(false);
      onUpdated?.();
      reset();
    } finally {
      setSubmitting(false);
    }
  }, [
    game.id,
    game.data.time,
    game.data.image,
    game.data.title,
    targetStatus,
    reviewText,
    reviewRating,
    file,
    user,
    onOpenChange,
    onUpdated,
    reset,
    getTextLength,
  ]);

  const getText = (status: string) => {
    const textMap = {
      COMPLETED: "Вы уверены, что хотите ЗАВЕРШИТЬ игру?",
      PLAYING: "Вы уверены, что хотите НАЧАТЬ игру?",
      DROPPED: "Вы уверены, что хотите ДРОПНУТЬ игру?",
      REROLL: "Вы уверены, что хотите РЕРОЛЛЬНУТЬ игру?",
    };

    return textMap[status as keyof typeof textMap];
  };

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
          <DialogTitle>{getText(targetStatus)}</DialogTitle>
          <DialogDescription>
            Это действие МОЖНО будет отменить, но лучше не надо
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
          {(targetStatus === "COMPLETED" ||
            targetStatus === "DROPPED" ||
            targetStatus === "REROLL") && (
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
          )}

          {(targetStatus === "COMPLETED" ||
            targetStatus === "DROPPED" ||
            targetStatus === "REROLL") && (
            <div className="w-full">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-start">
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-10 min-w-10 border border-input rounded items-center justify-center text-center flex hover:bg-accent hover:text-accent-foreground"
                    onClick={openFileDialog}
                    disabled={uploading}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <Editor
                      content={reviewText}
                      onChange={(e) => setReviewText(e)}
                      placeholder="Напишите отзыв..."
                      className="border-primary"
                    />
                  </div>
                </div>
                <div className="text-xs text-primary/70 text-right">
                  {textLength}/1000
                </div>
              </div>
            </div>
          )}

          {uploading && (
            <div className="flex items-center gap-3 p-2 bg-background rounded border border-border w-full">
              <SmallLoader />
              <span className="text-sm text-primary">Обработка файла…</span>
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
                      alt="game preview"
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
                {"Изображение." +
                  file?.name.split(".")[file?.name.split.length - 1]}
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
            disabled={submitting || (!!reviewText.trim() && textLength > 1000)}
          >
            Продолжить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default memo(GameStatus);
