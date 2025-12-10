import { useQuery } from "@tanstack/react-query";
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import GamesApi from "@/api/games.api";
import { Image } from "@/components/shared/image.component";
import { Button } from "@/components/ui/button.component";
import { SmallLoader } from "@/components/ui/loader.components";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.components";
import {
  type AnimationState,
  DEFAULT_ROLL_DURATION,
  getCenteredItem,
  MIN_ITEMS_FOR_ROLL,
  rollAnimation,
  rollPrepare,
  updateWheelAnimation,
} from "@/lib/wheel.utils";
import type { PresetType } from "@/types/games";
import {
  renderWheelItems,
  type ExtendedType,
} from "../components/itemsRender.component";
import Container from "../components/container.component";
import GamePreview from "../components/gamePreview.component";

const ITEM_WIDTH = 144;

export default function Preset() {
  const [isRolling, setIsRolling] = useState(false);
  const [shuffledItems, setShuffledItems] = useState<ExtendedType[]>([]);
  const [previewGame, setPreviewGame] = useState<PresetType["games"][0] | null>(
    null,
  );
  const [hasRolled, setHasRolled] = useState(false);
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

  const [selectedFilter, setSelectedFilter] = useState(
    "Стратегическое отступление",
  );
  const { data, isError, isLoading } = useQuery({
    queryKey: ["presetData"],
    queryFn: async () => {
      return new GamesApi().getPresets();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const filteredData = useMemo(() => {
    if (!data || !selectedFilter) return data;
    return data.filter((item) => item.label === selectedFilter);
  }, [data, selectedFilter]);

  const filteredGames = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    const selectedPreset = filteredData[0];
    return selectedPreset.games.map(
      (game: PresetType["games"][0], index: number) => ({
        id: game.id?.toString() ?? `game-${index}`,
        text: game.title,
        image: game.image,
      }),
    );
  }, [filteredData]);

  const gamesLookup = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return new Map();
    const selectedPreset = filteredData[0];
    const map = new Map<string, PresetType["games"][0]>();
    for (let index = 0; index < selectedPreset.games.length; index++) {
      const game = selectedPreset.games[index];
      const gameId = game.id?.toString() ?? `game-${index}`;
      map.set(gameId, game);
    }
    return map;
  }, [filteredData]);

  const selectCenteredPreview = useCallback(() => {
    if (!containerRef.current || !hasRolled) return;
    const viewportWidth = containerRef.current.parentElement?.clientWidth ?? 0;
    const itemCount = shuffledItems.length;
    if (itemCount === 0) return;
    const centeredIndex: number = getCenteredItem(
      scrollPositionRef.current,
      viewportWidth,
      itemCount,
      ITEM_WIDTH,
    );
    if (centeredIndex >= 0 && centeredIndex < shuffledItems.length) {
      const centered = shuffledItems[centeredIndex];
      const itemFromMap = gamesLookup.get(centered.id);
      setPreviewGame(
        itemFromMap ?? (centered as unknown as PresetType["games"][0]),
      );
    }
  }, [shuffledItems, gamesLookup, hasRolled]);

  // Initialize shuffledItems only when filteredGames changes
  useEffect(() => {
    if (filteredGames.length > 0) {
      const { itemsForRoll } = rollPrepare(filteredGames, MIN_ITEMS_FOR_ROLL);
      setShuffledItems(itemsForRoll as ExtendedType[]);
      scrollPositionRef.current = 0;
      if (containerRef.current) {
        containerRef.current.style.transform = `translateX(0px)`;
      }
      setPreviewGame(null);
      setHasRolled(false);
    }
  }, [filteredGames]);

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
        setHasRolled(true);
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
      if (hasRolled) {
        selectCenteredPreview();
      }
    }
  }, [isRolling, updateCenterHighlight, selectCenteredPreview, hasRolled]);

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

  const renderedItems = useMemo(
    () => (
      <>
        {renderWheelItems(
          shuffledItems,
          0,
          isRolling,
          containerRef as RefObject<HTMLDivElement>,
          ITEM_WIDTH,
          hasRolled ? setPreviewGame : () => {},
          undefined,
          undefined,
          gamesLookup,
        )}
      </>
    ),
    [shuffledItems, isRolling, gamesLookup, hasRolled],
  );

  const handleRoll = useCallback(async () => {
    if (isRolling || filteredGames.length === 0) return;
    const { itemsForRoll } = rollPrepare(filteredGames, MIN_ITEMS_FOR_ROLL);
    setIsRolling(true);
    setHasRolled(false);
    setPreviewGame(null);
    scrollPositionRef.current = 0;
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(0px)`;
    }
    setShuffledItems(itemsForRoll as ExtendedType[]);
    animationStateRef.current = {
      startTime: 0,
      velocity: 0,
      isRolling: true,
    };
    rollAnimation(animate, animationFrameRef);
  }, [isRolling, animate, filteredGames]);

  if (isLoading) return <ModalLoading />;
  if (isError) return <ModalError />;

  const games = data?.map((item) => ({
    value: item.label,
    label: item.label,
    count: item.games.length,
  }));

  return (
    <main className="flex flex-col gap-4 w-full items-center">
      <Tabs
        value={selectedFilter}
        onValueChange={(value) => {
          setSelectedFilter(value);
          setPreviewGame(null);
          setHasRolled(false);
        }}
        defaultValue="все"
        className="w-full h-full flex flex-col"
      >
        <section className="flex flex-row max-lg:flex-col w-full justify-start items-center gap-2 ">
          <TabsList className="h-fit flex-wrap w-fit flex max-lg:flex-col gap-2 rounded-lg bg-background/50 backdrop-blur-sm p-1.5 border border-border/50 shadow-sm self-start max-lg:w-full">
            {games?.map((game) => (
              <TabsTrigger
                key={game.label}
                value={game.label}
                className="rounded transition-all duration-200 hover:bg-primary/10 data-[state=active]:bg-primary/30 data-[state=active]:shadow-md cursor-pointer max-lg:w-full"
                disabled={isRolling}
              >
                {game.label.toUpperCase()} ({game.count})
              </TabsTrigger>
            ))}
          </TabsList>
        </section>
        <section className="flex w-full justify-center">
          {filteredData?.map((game, index) => (
            <TabsContent
              //biome-ignore lint/suspicious/noArrayIndexKey: <not gonna fix anything index related>
              key={index}
              value={game.label}
              className="text-primary w-2xl flex flex-col items-center justify-center gap-2"
            >
              {/* Wheel Section */}
              <Container
                containerRef={containerRef}
                renderedItems={renderedItems}
              />

              <section className="flex flex-row gap-1 my-2 w-full">
                <Button
                  disabled={isRolling}
                  className="flex-1"
                  onClick={handleRoll}
                >
                  {isRolling ? <SmallLoader /> : "Крутить"}
                </Button>
              </section>
            </TabsContent>
          ))}
        </section>

        <section className="flex flex-col text-start items-center justify-center">
          {previewGame && (
            <GamePreview game={previewGame} setOpen={setHasRolled} />
          )}
          {filteredData?.map((preset) => (
            <div
              key={preset.label}
              className="flex flex-col gap-4 p-4 max-w-2xl mx-auto w-full"
            >
              <div className="grid gap-3">
                <span className="text-primary font-bold">{preset.label}:</span>
                {preset.games.map((item: PresetType["games"][0]) => (
                  <Button
                    key={item.id}
                    className="w-full min-h-[100px] h-fit text-start rounded border border-border/40 bg-card/30 p-3 flex gap-3 overflow-hidden backdrop-blur-sm transition-all duration-300 text-wrap"
                    onClick={() => setPreviewGame(item)}
                  >
                    {item.image && (
                      <div className="relative shrink-0">
                        <div className="relative rounded border border-border/40 bg-muted/40 p-1 transition-colors">
                          <Image
                            src={item.image}
                            alt={item.title}
                            className="size-16 rounded object-contain bg-background/40 select-none transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-2 w-full min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        {!!item.title && (
                          <h3 className="font-semibold text-sm truncate text-foreground/90 tracking-wide">
                            {item.title}
                          </h3>
                        )}
                        {!!item.score && (
                          <span className="absolute top-2 right-2 inline-flex items-center rounded border border-primary/40 bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary/90">
                            {item.score}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground/90">
                        {!!item.score && (
                          <span className="inline-flex items-center gap-1">
                            <span className="opacity-70">Оценка:</span>
                            <span className="font-medium text-foreground">
                              {item.score}
                            </span>
                          </span>
                        )}
                        {!!item.time && (
                          <span className="inline-flex items-center gap-1">
                            <span className="opacity-70">Время:</span>
                            <span className="font-medium text-foreground">
                              {item.time} ч
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </section>
      </Tabs>
    </main>
  );
}
