import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { RecordModel } from "pocketbase";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import GamesApi from "@/api/games.api";
import { Button } from "@/components/ui/button.component";
import { SmallLoader } from "@/components/ui/loader.components";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/modal.component";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import { useSubscription } from "@/hooks/useSubscription";
import {
  type AnimationState,
  DEFAULT_ROLL_DURATION,
  getCenteredItem,
  MIN_ITEMS_FOR_ROLL,
  rollAnimation,
  rollPrepare,
  updateWheelAnimation,
} from "@/lib/wheel.utils";
import { useLoginStore } from "@/store/login.store";
import {
  renderWheelItems,
  type ExtendedType,
} from "../components/itemsRender.component";
import Container from "../components/container.component";
import AddPreset from "../components/addPreset.component";

const PresetGame = lazy(() => import("../components/presetGame.component"));

const ITEM_WIDTH = 144;

export default function Games() {
  const queryClient = useQueryClient();
  const user = useLoginStore((state) => state.user);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationStateRef = useRef<AnimationState>({
    startTime: 0,
    velocity: 0,
    isRolling: false,
  });
  const scrollPositionRef = useRef(0);
  const lastHighlightedIndexRef = useRef<number | null>(null);

  const [isRolling, setIsRolling] = useState(false);
  const [openAddItem, setOpenAddItem] = useState(false);
  const [editingPreset, setEditingPreset] = useState<RecordModel | null>(null);
  const [shuffledItems, setShuffledItems] = useState<ExtendedType[]>([]);

  const updateCenterHighlight = useCallback(() => {
    if (!containerRef.current) return;
    const viewportWidth = containerRef.current.parentElement?.clientWidth ?? 0;
    const itemCount = containerRef.current.children.length;
    if (itemCount === 0) return;
    const centeredIndex: number = getCenteredItem(
      scrollPositionRef.current,
      viewportWidth,
      itemCount,
      ITEM_WIDTH,
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
      const curr = containerRef.current.children[centeredIndex] as HTMLElement;
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

  const { data, isError, isLoading } = useQuery({
    queryKey: ["presetsAllData"],
    queryFn: async () => {
      return new GamesApi().getPresets();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const invalidatePresets = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["presetsAllData"],
      refetchType: "all",
    });
  }, [queryClient]);

  useSubscription("presets", "*", invalidatePresets);

  // Convert presets to wheel items using first game's image
  const presetItems = useMemo(() => {
    if (!data) return [];
    return data.map((preset) => ({
      id: preset.label,
      text: preset.label,
      image: preset.games[0]?.image,
    }));
  }, [data]);

  // Optimized animate function
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
      if (containerRef.current) {
        containerRef.current.style.transform = `translateX(-${scrollPositionRef.current}px)`;
        updateCenterHighlight();
      }
      if (isCompleted) {
        state.isRolling = false;
        setIsRolling(false);
      } else {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    },
    [updateCenterHighlight],
  );

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Initialize shuffledItems when presetItems changes
  useEffect(() => {
    if (presetItems.length > 0) {
      const { itemsForRoll } = rollPrepare(presetItems, MIN_ITEMS_FOR_ROLL);
      setShuffledItems(itemsForRoll);

      scrollPositionRef.current = 0;
      if (containerRef.current) {
        containerRef.current.style.transform = `translateX(0px)`;
      }
    }
  }, [presetItems]);

  // Keep center highlight updated whenever we're idle
  useEffect(() => {
    if (!isRolling) {
      updateCenterHighlight();
    }
  }, [isRolling, updateCenterHighlight]);

  // Recompute on data changes when idle
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

  const renderedItems = useMemo(
    () =>
      <>{renderWheelItems(
        shuffledItems,
        0,
        isRolling,
        containerRef as RefObject<HTMLDivElement>,
        ITEM_WIDTH,
        () => {},
        undefined,
        undefined,
        new Map(),
      )}</>,
    [shuffledItems, isRolling],
  );

  const handleRoll = useCallback(async () => {
    if (isRolling || presetItems.length === 0) return;
    const { itemsForRoll } = rollPrepare(presetItems, MIN_ITEMS_FOR_ROLL);
    setIsRolling(true);
    scrollPositionRef.current = 0;
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
  }, [isRolling, animate, presetItems]);

  if (isLoading) return <ModalLoading />;
  if (isError) return <ModalError />;

  return (
    <main className="flex flex-col gap-2 w-full items-center">
      {/* Wheel Section */}
      <Container containerRef={containerRef} renderedItems={renderedItems} />

      {/* Roll Button */}
      <section className="flex flex-row gap-1 my-2 w-full max-w-md">
        <Button disabled={isRolling} className="flex-1" onClick={handleRoll}>
          {isRolling ? <SmallLoader /> : "Крутить"}
        </Button>
      </section>

      <section className="flex flex-col gap-2 w-2xl items-center">
        {user?.admin && (
          <Dialog open={openAddItem} onOpenChange={setOpenAddItem}>
            <DialogTrigger asChild>
              <Button className="w-3xl h-[90px] border border-primary rounded opacity-70 hover:opacity-100 transition-all duration-20 cursor-pointer">
                <Plus className="h-full w-full" />
              </Button>
            </DialogTrigger>
            <DialogContent
              className="flex flex-col text-center items-center justify-center p-4 bg-background border-2 border-primary rounded text-primary"
              style={{
                maxHeight: "90%",
              }}
            >
              <DialogHeader>
                <DialogTitle>{`> СОЗДАТЬ ПРЕСЕТ <`}</DialogTitle>
                <DialogDescription className="text-center text-primary font-mono text-xs">
                  Создайте новый пресет
                </DialogDescription>
              </DialogHeader>
              <section className="w-full h-full rounded overflow-y-auto">
                <AddPreset setOpen={setOpenAddItem} />
              </section>
            </DialogContent>
          </Dialog>
        )}
        {data?.map((preset, index) => (
          <Dialog
            key={preset.label}
            open={editingPreset?.label === preset.label}
            onOpenChange={(open) => {
              if (!open) {
                return setEditingPreset(null);
              }
              return setEditingPreset(preset);
            }}
          >
            <DialogTrigger asChild>
              <Button
                //biome-ignore lint/suspicious/noArrayIndexKey: <not gonna fix anything index related>
                key={index}
                className="w-3xl h-[90px] border border-primary rounded opacity-70 hover:opacity-100 transition-all duration-20 cursor-pointer"
                disabled={!user?.admin}
              >
                {preset.label} ({preset.games.length})
              </Button>
            </DialogTrigger>
            <DialogContent
              className="flex flex-col text-center items-center justify-center p-4 bg-background border-2 border-primary rounded text-primary"
              style={{
                width: "70%",
                height: "70%",
                maxWidth: "90%",
                maxHeight: "90%",
              }}
            >
              <DialogHeader>
                <DialogTitle>{`> ${preset.label} <`}</DialogTitle>
                <DialogDescription className="text-center text-primary font-mono text-xs">
                  Измените пресет
                </DialogDescription>
              </DialogHeader>
              <section className="w-full h-full rounded overflow-y-auto">
                <Suspense fallback={<ModalLoading />}>
                  <PresetGame
                    setOpen={setOpenAddItem}
                    id={preset.id}
                    preset={preset.games ?? []}
                  />
                </Suspense>
              </section>
            </DialogContent>
          </Dialog>
        ))}
      </section>
    </main>
  );
}
