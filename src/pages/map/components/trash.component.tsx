import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import type { RecordModel } from "pocketbase";
import {
  lazy,
  memo,
  type RefObject,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ItemsApi from "@/api/items.api";
import { Button } from "@/components/ui/button.component";
import { SmallLoader } from "@/components/ui/loader.components";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/modal.component";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import { useSubscription } from "@/hooks/useSubscription";
import {
  type AnimationState,
  DEFAULT_ROLL_DURATION,
  getCenteredItem,
  getItemImageUrl,
  MIN_ITEMS_FOR_ROLL,
  rollAnimation,
  rollPrepare,
  updateWheelAnimation,
} from "@/lib/wheel.utils";
import {
  type ExtendedType,
  renderWheelItems,
} from "@/pages/wheel/components/itemsRender.component";
import type { ItemType } from "@/types/items";
import { useLoginStore } from "@/store/login.store";
import UsersApi from "@/api/users.api";

import Toast from "@/components/ui/toast.component";

const ItemCard = lazy(() => import("@/components/shared/itemCard.component"));

const itemsApi = new ItemsApi();
const usersApi = new UsersApi();

const Trash = memo(
  ({
    setIsOpen,
  }: Readonly<{
    setIsOpen: (isOpen: boolean) => void;
  }>) => {
    const queryClient = useQueryClient();

    const user = useLoginStore((state) => state.user);

    const [isAdding, setIsAdding] = useState(false);

    const { data, isLoading, isError } = useQuery({
      queryKey: ["trash"],
      queryFn: async () => {
        return await itemsApi.getTrash();
      },
    });

    const invalidateQuery = useCallback(() => {
      startTransition(() => {
        queryClient.invalidateQueries({
          queryKey: ["trash"],
          refetchType: "all",
        });
      });
    }, [queryClient]);

    useSubscription("items", "*", invalidateQuery);
    useSubscription("trash", "*", invalidateQuery);

    const [shuffledItems, setShuffledItems] = useState<ExtendedType[]>([]);
    const [previewItem, setPreviewItem] = useState<RecordModel | null>(null);
    const [isRolling, setIsRolling] = useState(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const animationStateRef = useRef<AnimationState>({
      startTime: 0,
      velocity: 0,
      isRolling: false,
    });
    const scrollPositionRef = useRef(0);
    const lastHighlightedIndexRef = useRef<number | null>(null);

    const updateCenterHighlight = useCallback(() => {
      if (!containerRef.current) return;
      const viewportWidth =
        containerRef.current.parentElement?.clientWidth ?? 0;
      const itemCount = containerRef.current.children.length;
      if (itemCount === 0) return;

      const centeredIndex: number = getCenteredItem(
        scrollPositionRef.current,
        viewportWidth,
        itemCount,
        144,
      );

      if (
        lastHighlightedIndexRef.current !== null &&
        containerRef.current.children[lastHighlightedIndexRef.current]
      ) {
        const prev = containerRef.current.children[
          lastHighlightedIndexRef.current
        ] as HTMLElement;
        prev.classList.remove(
          "scale-105",
          "bg-primary/20",
          "border-primary",
          "glow-text",
        );
        prev.classList.add("border-muted/30");
      }

      if (centeredIndex >= 0 && containerRef.current.children[centeredIndex]) {
        const curr = containerRef.current.children[
          centeredIndex
        ] as HTMLElement;
        curr.classList.add(
          "scale-105",
          "bg-primary/20",
          "border-primary",
          "glow-text",
        );
        curr.classList.remove("border-muted/30");
        lastHighlightedIndexRef.current = centeredIndex;
      } else {
        lastHighlightedIndexRef.current = null;
      }
    }, []);

    const itemsLookup = useMemo(() => {
      if (!data || data.length === 0) return new Map();
      const map = new Map<string, ItemType>();
      for (const item of data) {
        map.set(item.id as string, item);
      }

      return map;
    }, [data]);

    const itemsForWheel = useMemo<ExtendedType[]>(() => {
      if (!data) return [];
      return data.map((it: ItemType) => {
        const imageFile = (it as unknown as { image?: string }).image;
        const id = (it as unknown as { id?: string }).id ?? "";
        const label = (it as unknown as { label?: string }).label ?? "";
        const type =
          (it as unknown as { type?: string | null }).type ?? undefined;
        return {
          id: String(id),
          text: String(label),
          type: type ?? undefined,
          image: getItemImageUrl(String(id), imageFile),
        };
      });
    }, [data]);

    const selectCenteredPreview = useCallback(() => {
      if (!containerRef.current) return;
      const viewportWidth =
        containerRef.current.parentElement?.clientWidth ?? 0;
      const itemCount = shuffledItems.length;
      if (itemCount === 0) return;

      const centeredIndex: number = getCenteredItem(
        scrollPositionRef.current,
        viewportWidth,
        itemCount,
        144,
      );

      if (centeredIndex >= 0 && centeredIndex < shuffledItems.length) {
        const centered = shuffledItems[centeredIndex];
        const itemFromMap = itemsLookup.get(centered.id);
        setPreviewItem(itemFromMap ?? (centered as unknown as RecordModel));
      }
    }, [shuffledItems, itemsLookup]);

    // Optimized animate function - no state updates during animation
    const animate = useCallback(
      (timestamp: number) => {
        const state = animationStateRef.current;
        const duration = DEFAULT_ROLL_DURATION;
        const { velocity, scrollDelta, isCompleted } = updateWheelAnimation(
          timestamp,
          state,
          duration,
        );

        state.velocity = velocity;
        scrollPositionRef.current += scrollDelta;

        // Direct DOM manipulation - no React state updates
        if (containerRef.current) {
          containerRef.current.style.transform = `translateX(-${scrollPositionRef.current}px)`;

          // Update highlight on each frame
          updateCenterHighlight();
        }

        if (isCompleted) {
          state.isRolling = false;
          setIsRolling(false);
          selectCenteredPreview();
        } else {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      },
      [updateCenterHighlight, selectCenteredPreview],
    );

    useEffect(() => {
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, []);

    // Keep center highlight updated whenever we're idle
    useEffect(() => {
      if (!isRolling) {
        updateCenterHighlight();
        selectCenteredPreview();
      }
    }, [isRolling, updateCenterHighlight, selectCenteredPreview]);

    // Recompute on data/filter changes when idle
    useEffect(() => {
      if (!isRolling) updateCenterHighlight();
    }, [updateCenterHighlight, isRolling]);

    // Recompute on viewport resize when idle
    useEffect(() => {
      const onResize = () => {
        if (!isRolling) updateCenterHighlight();
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, [isRolling, updateCenterHighlight]);

    // Simplified renderedItems - remove scrollPosition dependency
    const renderedItems = useMemo(
      () => (
        <>
          {renderWheelItems(
            shuffledItems,
            0,
            isRolling,
            containerRef as RefObject<HTMLDivElement>,
            144,
            undefined,
            (item) => {
              if (itemsLookup.has(item.id)) {
                setPreviewItem(itemsLookup.get(item.id));
              } else {
                setPreviewItem(item as unknown as RecordModel);
              }
            },
            undefined,
            undefined,
            itemsLookup,
          )}
        </>
      ),
      [shuffledItems, isRolling, itemsLookup],
    );

    const handleRoll = useCallback(async () => {
      if (isRolling || itemsForWheel.length === 0) return;

      const { itemsForRoll } = rollPrepare(itemsForWheel, MIN_ITEMS_FOR_ROLL);

      setIsRolling(true);
      scrollPositionRef.current = 0;

      // Reset container position
      if (containerRef.current) {
        containerRef.current.style.transform = `translateX(0px)`;
      }

      setShuffledItems(itemsForRoll);

      animationStateRef.current = {
        startTime: 0,
        velocity: 0,
        isRolling: true,
      };

      rollAnimation(animate, animationFrameRef);
    }, [isRolling, animate, itemsForWheel]);

    if (isLoading) return <ModalLoading />;
    if (isError) return <ModalError />;

    return (
      <DialogContent
        className="flex flex-col gap-4 border-2 border-primary rounded bg-background/95 backdrop-blur-sm p-6 text-primary  overflow-y-scroll"
        style={{
          width: "800px",
          maxWidth: "95vw",
          height: "auto",
          minHeight: "600px",
          maxHeight: "90vh",
        }}
        showCloseButton={false}
      >
        <DialogHeader className="text-primary relative border-b border-primary/20 pb-4">
          <DialogClose
            className="absolute right-0 top-0 rounded opacity-70 hover:opacity-100 hover:bg-accent transition-colors cursor-pointer p-2"
            onClick={() => setIsOpen}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogTitle className="text-center text-xl font-bold tracking-wider">{`> ${"МУСОРКА".toUpperCase()} <`}</DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            Залезайте в мусорку
          </DialogDescription>
        </DialogHeader>
        <main className="flex flex-col items-center justify-center gap-2 w-full">
          {/* Wheel Section */}
          <section className="max-w-full w-2xl flex items-center justify-center mx-auto">
            <div className="relative w-full h-48 border-2 border-primary rounded overflow-hidden bg-card/50 shadow-lg glow-effect">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary z-10 shadow-[0_0_10px_rgba(0,255,0,0.8)]" />
              <div
                ref={containerRef}
                className="flex items-center h-full will-change-transform"
              >
                {renderedItems}
              </div>
            </div>
          </section>

          <Button
            onClick={async () => {
              if (isRolling) return;
              await usersApi.changeTrash(String(user?.id), true);
              handleRoll();
            }}
            disabled={!data || data.length === 0 || user?.trash || isRolling}
            className="w-2xl"
          >
            {isRolling ? <SmallLoader /> : "КРУТИТЬ"}
          </Button>

          {!!previewItem && (
            <main className="flex flex-col">
              <ItemCard item={previewItem} className="w-2xl" />
              <Button
                className="w-full my-1"
                disabled={isAdding}
                onClick={async () => {
                  setIsAdding(true);

                  if (!user || !previewItem) {
                    setIsAdding(false);
                    return Toast("Вы не авторизованы", "error");
                  }

                  await usersApi.addItem(user.id, previewItem.id);
                  await itemsApi.removeTrash(previewItem.instanceId);

                  Toast("Предмет успешно добавлен", "success");
                  setIsAdding(false);
                  setPreviewItem(null);
                }}
              >
                {isAdding ? <SmallLoader /> : "Добавить в инвентарь"}
              </Button>
            </main>
          )}

          <section className="flex flex-col w-2xl gap-2">
            {data?.map((item, index) => (
              <ItemCard
                key={`${index} ${item.id}`}
                item={item}
                className="w-2xl"
              />
            ))}
          </section>
        </main>
      </DialogContent>
    );
  },
);

export default Trash;
