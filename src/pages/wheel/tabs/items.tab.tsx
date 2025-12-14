import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import type { RecordModel } from "pocketbase";
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ItemsApi from "@/api/items.api";
import UsersApi from "@/api/users.api";
import { Button } from "@/components/ui/button.component";
import { SmallLoader } from "@/components/ui/loader.components";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.components";
import { useSubscription } from "@/hooks/useSubscription";
import { getWheelPrice } from "@/lib/utils";
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
import { useLoginStore } from "@/store/login.store";
import Inventory from "../components/inventory.component";
import {
  type ExtendedType,
  renderWheelItems,
} from "../components/itemsRender.component";
import ItemPreview from "../components/itemPreview.component";
import Container from "../components/container.component";

const types = ["все", "бафф", "дебафф"];
const ITEM_WIDTH = 144;

export default function Items() {
  const user = useLoginStore((state) => state.user);
  const queryClient = useQueryClient();
  const itemsApi = new ItemsApi();
  const usersApi = new UsersApi();

  const [selectedFilter, setSelectedFilter] = useState<string>("все");

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
    queryKey: ["wheelItems"],
    queryFn: async () => {
      const items = await itemsApi.getAllItems();
      return items.filter(
        (item) =>
          (item as unknown as { rollable?: boolean }).rollable !== false,
      );
    },
  });

  const {
    data: userMoney,
    isError: userMoneyError,
    isLoading: userMoneyLoading,
    refetch: refetchUserMoney,
  } = useQuery({
    queryKey: ["userWheelMoney", user?.id],
    queryFn: async () => {
      if (!user) return;

      const userData = await usersApi.getMoney(user.id);
      return (userData.data as { money: { current: number } }).money.current;
    },
  });

  const invalidateUserMoney = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["userWheelMoney", user?.id],
      refetchType: "all",
    });
  }, [queryClient, user?.id]);

  useSubscription("users", "*", invalidateUserMoney);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    if (selectedFilter === "все") return data;
    return data.filter(
      (item) => (item as unknown as { type?: string }).type === selectedFilter,
    );
  }, [data, selectedFilter]);

  const getTypeCount = useCallback(
    (type: string) => {
      if (!data) return 0;

      const lengthMap = {
        все: data.length,
        бафф: data.filter(
          (item) => (item as unknown as { type?: string }).type === "бафф",
        ).length,
        дебафф: data.filter(
          (item) => (item as unknown as { type?: string }).type === "дебафф",
        ).length,
      };

      return lengthMap[type as keyof typeof lengthMap] || 0;
    },
    [data],
  );

  const itemsLookup = useMemo(() => {
    if (!filteredItems || filteredItems.length === 0) return new Map();
    const map = new Map<string, RecordModel>();
    for (const item of filteredItems) {
      map.set(item.id as string, item);
    }

    return map;
  }, [filteredItems]);

  const itemsForWheel = useMemo<ExtendedType[]>(() => {
    if (!filteredItems) return [];
    return filteredItems.map((it: RecordModel) => {
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
  }, [filteredItems]);

  const selectCenteredPreview = useCallback(() => {
    if (!containerRef.current) return;
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
          0, // Pass 0 since we're handling transform via direct DOM
          isRolling,
          containerRef as RefObject<HTMLDivElement>,
          ITEM_WIDTH,
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
  if (isError || userMoneyError) return <ModalError />;

  const rollButton = () => {
    if (isRolling) return <SmallLoader />;
    const wheelPrice = getWheelPrice(
      (user?.data as { totalFinish?: number })?.totalFinish ?? 0,
    );
    const currentMoney =
      (user?.data as { money: { current: number } })?.money.current ?? 0;
    if (currentMoney < wheelPrice)
      return `До колеса (${wheelPrice - currentMoney})`;
    return `Крутить (${wheelPrice} чубриков)`;
  };

  return (
    <main className="flex flex-col gap-4 w-full items-center">
      <Tabs
        value={selectedFilter}
        onValueChange={(value) => setSelectedFilter(value)}
        defaultValue="все"
        className="w-full h-full flex flex-col"
      >
        <section className="flex flex-row max-lg:flex-col w-full justify-start items-center gap-2">
          <TabsList className="h-auto w-fit flex max-lg:flex-col gap-2 rounded-lg bg-background/50 backdrop-blur-sm p-1.5 border border-border/50 shadow-sm self-start max-lg:w-full">
            {types.map((type) => (
              <TabsTrigger
                key={type}
                value={type}
                className="rounded transition-all duration-200 hover:bg-primary/10 data-[state=active]:bg-primary/30 data-[state=active]:shadow-md cursor-pointer max-lg:w-full"
              >
                {type.toUpperCase()} ({getTypeCount(type)})
              </TabsTrigger>
            ))}
          </TabsList>
          <Button onClick={() => refetchUserMoney()}>
            {userMoneyLoading ? (
              <SmallLoader />
            ) : (
              userMoney ||
              (user?.data as { money: { current: number } })?.money.current
            )}
            {` чубриков`}
          </Button>
        </section>
        <section className="flex w-full justify-center">
          {types.map((item) => (
            <TabsContent
              key={item}
              value={item}
              className="text-primary w-2xl flex flex-col items-center justify-center gap-2"
            >
              <Container
                containerRef={containerRef}
                renderedItems={renderedItems}
              />

              <section className="flex flex-row gap-1 my-2 w-full">
                <Button
                  onClick={async () => {
                    if (!user) return;
                    const currentMoney = (
                      user.data as { money: { current: number } }
                    ).money.current;
                    const wheelPrice = getWheelPrice(
                      (user.data as { totalFinish?: number })?.totalFinish ?? 0,
                    );
                    if (currentMoney < wheelPrice) return;
                    await usersApi.changeMoney(user.id, -wheelPrice);
                    handleRoll();
                  }}
                  disabled={
                    isRolling ||
                    ((user?.data as { money: { current: number } })?.money
                      .current ?? 0) <
                      getWheelPrice(
                        (user?.data as { totalFinish?: number })?.totalFinish ??
                          0,
                      )
                  }
                  className="flex-1"
                >
                  {rollButton()}
                </Button>
                <Button size="icon" onClick={handleRoll} disabled={isRolling}>
                  {isRolling ? <SmallLoader /> : <RefreshCcw />}
                </Button>
              </section>

              {previewItem && (
                <ItemPreview
                  previewItem={previewItem}
                  setPreviewItem={setPreviewItem}
                />
              )}

              <section className="flex flex-col gap-2 w-full my-2">
                <span className="text-start">ИНВЕНТАРЬ:</span>
                <Inventory userId={user?.id as string} />
              </section>
            </TabsContent>
          ))}
        </section>
      </Tabs>
    </main>
  );
}
