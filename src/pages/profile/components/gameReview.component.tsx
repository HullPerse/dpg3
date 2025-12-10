import { Pencil } from "lucide-react";
import type { RecordModel } from "pocketbase";
import { lazy, memo, Suspense, useState } from "react";
import { gameImage } from "@/api/client.api";
import { Image } from "@/components/shared/image.component";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion.component";
import { Button } from "@/components/ui/button.component";
import { ModalLoading } from "@/components/ui/modal.state";

const EditReviewDialog = lazy(() => import("@/components/ui/review.component"));

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*?v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = new RegExp(pattern).exec(url);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function isYouTubeLink(text: string): boolean {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/.test(
    text,
  );
}

function parseReviewText(text: string): Array<{
  type: "text" | "youtube";
  content: string;
  videoId?: string;
}> {
  const result: Array<{
    type: "text" | "youtube";
    content: string;
    videoId?: string;
  }> = [];

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches: Array<{
    url: string;
    startIndex: number;
    endIndex: number;
  }> = [];

  for (const match of text.matchAll(urlRegex)) {
    if (isYouTubeLink(match[0])) {
      matches.push({
        url: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  if (matches.length === 0) {
    result.push({ type: "text", content: text });
  } else {
    let lastIndex = 0;
    for (const urlMatch of matches) {
      if (urlMatch.startIndex > lastIndex) {
        result.push({
          type: "text",
          content: text.substring(lastIndex, urlMatch.startIndex),
        });
      }

      const videoId = extractYouTubeId(urlMatch.url);
      if (videoId) {
        result.push({
          type: "youtube",
          content: urlMatch.url,
          videoId,
        });
      } else {
        result.push({
          type: "text",
          content: urlMatch.url,
        });
      }

      lastIndex = urlMatch.endIndex;
    }

    if (lastIndex < text.length) {
      result.push({
        type: "text",
        content: text.substring(lastIndex),
      });
    }
  }

  return result;
}

function GameReview({
  game,
  canEdit = false,
  onUpdated,
}: Readonly<{
  game: RecordModel;
  canEdit?: boolean;
  onUpdated?: () => void;
}>) {
  const [openEdit, setOpenEdit] = useState(false);
  const reviewText = game.reviewText || null;
  const reviewImage = game.reviewImage || null;
  const reviewParts = reviewText ? parseReviewText(reviewText) : [];

  return (
    <>
      <section className="flex flex-row w-full mt-4 gap-1 justify-center">
        {canEdit && (
          <Button
            size="icon"
            className="h-12 max-w-12 w-12 flex items-center justify-center rounded hover:bg-accent hover:text-accent-foreground"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setOpenEdit(true);
            }}
            aria-label="Редактировать отзыв"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        <div className="relative rounded border w-full">
          <Accordion type="single" collapsible>
            <AccordionItem value="game-review" className="px-1">
              <AccordionTrigger className="w-full group font-bold text-lg sm:text-xl flex items-center gap-3 px-3 py-2 rounded flex-1">
                <span>Отзыв</span>
              </AccordionTrigger>

              {/* </div> */}
              <AccordionContent className="px-3 pb-3">
                {reviewText && (
                  <div className="rounded bg-background/70 p-3 text-sm sm:text-base leading-relaxed text-muted text-start">
                    {(() => {
                      const isHTML = /<[a-z][\s\S]*>/i.test(reviewText);

                      if (isHTML) {
                        const youtubeLinks = reviewParts.filter(
                          (p) => p.type === "youtube" && p.videoId,
                        );

                        if (youtubeLinks.length > 0) {
                          let processedHTML = reviewText;
                          const placeholders: Array<{
                            placeholder: string;
                            videoId: string;
                          }> = [];

                          for (const [idx, link] of youtubeLinks.entries()) {
                            const placeholder = `__YOUTUBE_PLACEHOLDER_${idx}__`;
                            placeholders.push({
                              placeholder,
                              videoId: link.videoId || "",
                            });
                            const escapedUrl = link.content.replaceAll(
                              /[.*+?^${}()|[\]\\]/g,
                              String.raw`\$&`,
                            );
                            processedHTML = processedHTML.replaceAll(
                              new RegExp(escapedUrl, "g"),
                              placeholder,
                            );
                          }

                          const parts = processedHTML.split(
                            /(__YOUTUBE_PLACEHOLDER_\d+__)/,
                          );

                          return (
                            <>
                              {parts.map((part: string, index: number) => {
                                const placeholderMatch =
                                  /^__YOUTUBE_PLACEHOLDER_(\d+)__$/.exec(part);
                                if (placeholderMatch) {
                                  const placeholderIdx = Number.parseInt(
                                    placeholderMatch[1],
                                    10,
                                  );
                                  const { videoId } =
                                    placeholders[placeholderIdx];
                                  return (
                                    <div
                                      key={`youtube-${videoId}-${index.toString()}`}
                                      className="my-3 w-full"
                                    >
                                      <div
                                        className="relative w-full aspect-video rounded overflow-hidden border border-border"
                                        style={{ minWidth: "260px" }}
                                      >
                                        <iframe
                                          src={`https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0`}
                                          title="YouTube video player"
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                          loading="lazy"
                                          className="absolute inset-0 w-full h-full"
                                        />
                                      </div>
                                    </div>
                                  );
                                }
                                if (part.trim()) {
                                  return (
                                    <div
                                      key={`html-${part.slice(0, 20)}-${index}`}
                                      className="prose prose-sm sm:prose-base max-w-none dark:prose-invert **:text-muted"
                                      // biome-ignore lint/security/noDangerouslySetInnerHtml: <it works>
                                      dangerouslySetInnerHTML={{ __html: part }}
                                    />
                                  );
                                }
                                return null;
                              })}
                            </>
                          );
                        }

                        return (
                          <div
                            className="prose prose-sm sm:prose-base max-w-none dark:prose-invert **:text-muted"
                            // biome-ignore lint/security/noDangerouslySetInnerHtml: <it works>
                            dangerouslySetInnerHTML={{ __html: reviewText }}
                          />
                        );
                      }

                      return reviewParts.map((part, index) => {
                        if (part.type === "youtube" && part.videoId) {
                          return (
                            <div key={index.toString()} className="my-3 w-full">
                              <div
                                className="relative w-full aspect-video rounded overflow-hidden border border-border"
                                style={{ minWidth: "260px" }}
                              >
                                <iframe
                                  src={`https://www.youtube-nocookie.com/embed/${part.videoId}?modestbranding=1&rel=0`}
                                  title="YouTube video player"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  loading="lazy"
                                  className="absolute inset-0 w-full h-full"
                                />
                              </div>
                            </div>
                          );
                        }
                        return (
                          <span
                            key={index.toString()}
                            className="whitespace-pre-wrap"
                          >
                            {part.content}
                          </span>
                        );
                      });
                    })()}
                  </div>
                )}

                {reviewImage && (
                  <div className="mt-3 overflow-hidden rounded border">
                    <Image
                      src={`${gameImage}${game.id}/${reviewImage}`}
                      alt="Review attachment"
                      className="w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {canEdit && (
        <Suspense fallback={<ModalLoading />}>
          <EditReviewDialog
            game={game}
            open={openEdit}
            onOpenChange={setOpenEdit}
            onUpdated={onUpdated}
          />
        </Suspense>
      )}
    </>
  );
}

export default memo(GameReview);
