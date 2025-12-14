import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign, Clock, Star } from "lucide-react";
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import GamesApi from "@/api/games.api";
import UsersApi from "@/api/users.api";
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
import { statusButtons } from "@/config/games.config";
import { useSubscription } from "@/hooks/useSubscription";
import { gameRewards } from "@/lib/utils";
import {
  type AnimationState,
  DEFAULT_ROLL_DURATION,
  getCenteredItem,
  MIN_ITEMS_FOR_ROLL,
  rollAnimation,
  rollPrepare,
  updateWheelAnimation,
} from "@/lib/wheel.utils";
import type { GameInterface, GameType, StatusType } from "@/types/games";
import Container from "../components/container.component";
import {
  type ExtendedType,
  renderWheelItems,
} from "../components/itemsRender.component";

const ITEM_WIDTH = 144;

export default function UserGames() {
  const queryClient = useQueryClient();

  const [selectedUser, setSelectedUser] = useState<string>("");
  const [gameState, setGameState] = useState<"ALL" | StatusType>("ALL");
  const [isRolling, setIsRolling] = useState(false);
  const [shuffledItems, setShuffledItems] = useState<ExtendedType[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollPositionRef = useRef(0);
  const lastHighlightedIndexRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationStateRef = useRef<AnimationState>({
    startTime: 0,
    velocity: 0,
    isRolling: false,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["userGames", selectedUser],
    queryFn: async () => {
      const allUsers = await new UsersApi().getExistingUsers();
      const userGames = await new GamesApi().getGamesByUser(selectedUser);

      return {
        users: allUsers,
        games: userGames as unknown as GameInterface[],
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

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

  const filteredItems = useMemo(() => {
    if (!data) return [];

    if (gameState === "ALL") return data.games;
    return data.games.filter((games) => games.status === gameState);
  }, [data, gameState]);

  const filteredGames = useMemo(() => {
    if (!filteredItems || filteredItems.length === 0) return [];
    return filteredItems.map((game: GameInterface, index: number) => ({
      id: game.id?.toString() ?? `game-${index}`,
      text: game.data.title,
      image: game.data.image,
    }));
  }, [filteredItems]);

  const gamesLookup = useMemo(() => {
    if (!filteredItems || filteredItems.length === 0) return new Map();
    const map = new Map<string, GameType>();
    for (let index = 0; index < filteredItems.length; index++) {
      const game = filteredItems[index];
      const gameId = game.id?.toString() ?? `game-${index}`;
      map.set(gameId, game.data);
    }
    return map;
  }, [filteredItems]);

  useEffect(() => {
    if (filteredGames.length > 0) {
      const { itemsForRoll } = rollPrepare(filteredGames, MIN_ITEMS_FOR_ROLL);
      setShuffledItems(itemsForRoll as ExtendedType[]);
      scrollPositionRef.current = 0;
      if (containerRef.current) {
        containerRef.current.style.transform = `translateX(0px)`;
      }
    }
  }, [filteredGames]);

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

  useEffect(() => {
    if (!isRolling) {
      updateCenterHighlight();
    }
  }, [isRolling, updateCenterHighlight]);

  useEffect(() => {
    if (!isRolling) updateCenterHighlight();
  }, [updateCenterHighlight, isRolling]);

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
          () => {},
          undefined,
          undefined,
          gamesLookup,
        )}
      </>
    ),
    [shuffledItems, isRolling, gamesLookup],
  );

  const handleRoll = useCallback(async () => {
    if (isRolling || filteredGames.length === 0) return;
    const { itemsForRoll } = rollPrepare(filteredGames, MIN_ITEMS_FOR_ROLL);
    setIsRolling(true);
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

  const invalidateInventory = useCallback(() => {
    if (selectedUser) {
      queryClient.invalidateQueries({
        queryKey: ["userGames", selectedUser],
        refetchType: "all",
      });
    }
  }, [queryClient, selectedUser]);

  useSubscription("games", "*", invalidateInventory);
  useSubscription("users", "*", invalidateInventory);

  if (isLoading) return <ModalLoading />;
  if (isError) return <ModalError />;

  return (
    <main className="flex flex-col gap-4 w-full items-center">
      <Tabs
        value={selectedUser}
        onValueChange={setSelectedUser}
        defaultValue=""
        className="w-full h-full flex flex-col"
      >
        <section className="flex flex-row max-lg:flex-col w-full justify-start items-center gap-2">
          <TabsList className="h-auto w-fit flex max-lg:flex-col gap-2 rounded-lg bg-background/50 backdrop-blur-sm p-1.5 border border-border/50 shadow-sm self-start max-lg:w-full">
            {data?.users.map((user) => (
              <TabsTrigger
                key={user.id}
                value={user.id}
                className="rounded transition-all duration-200 hover:bg-primary/10 data-[state=active]:bg-primary/30 data-[state=active]:shadow-md cursor-pointer max-lg:w-full flex items-center gap-2"
              >
                {user.username}
              </TabsTrigger>
            ))}
          </TabsList>
        </section>

        <section className="flex w-full justify-center">
          {data?.users?.map((user) => (
            <TabsContent
              key={user.id}
              value={user.id}
              className="text-primary w-2xl flex flex-col items-center justify-center gap-2"
            >
              <Container
                containerRef={containerRef}
                renderedItems={renderedItems}
              />

              <section className="flex flex-col gap-1 my-2 w-full items-center justify-center">
                <Button
                  disabled={isRolling || filteredItems?.length === 0}
                  className="w-2xl"
                  onClick={handleRoll}
                >
                  {isRolling ? <SmallLoader /> : "Крутить"}
                </Button>

                <section className="flex flex-row w-full items-center justify-center gap-1">
                  {statusButtons.map((button) => (
                    <Button
                      key={button.value}
                      disabled={isRolling || gameState === button.value}
                      onClick={() => setGameState(button.value as StatusType)}
                      className="rounded transition-all duration-200 hover:bg-primary/10 data-[state=active]:bg-primary/30 data-[state=active]:shadow-md cursor-pointer max-lg:w-full flex items-center gap-2"
                    >
                      {button.label}
                    </Button>
                  ))}
                </section>

                {filteredItems?.length === 0 && (
                  <div className="text-center p-8 text-muted-foreground">
                    У {user.username} нет игр с этим статусом
                  </div>
                )}

                {filteredItems?.reverse().map((game) => (
                  <section
                    key={game.data.title}
                    className="flex flex-row text-primary w-3xl border border-primary rounded items-ceneter p-2 gap-2 font-bold"
                  >
                    {game.data.image && (
                      <div className="relative shrink-0">
                        <div className="relative rounded border border-border/40 bg-muted/40 p-1 transition-colors">
                          <Image
                            src={game.data.image}
                            alt={game.data.title}
                            className="size-16 rounded object-contain bg-background/40 select-none transition-transform duration-300"
                            draggable={false}
                            loading="lazy"
                          />
                          <div
                            className="pointer-events-none absolute inset-0 rounded opacity-0 transition-opacity duration-300"
                            style={{
                              background:
                                "radial-gradient(60% 60% at 50% 50%, hsl(var(--primary) / 0.05), transparent)",
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <section className="flex flex-col w-full h-full">
                      <span className="text-start">{game.data.title}</span>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {!!game.data.time && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4 text-primary/70" />
                            <span className="font-medium">
                              {game.data.time}
                            </span>
                          </div>
                        )}
                        {!!game.data.score && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">
                              {game.data.score}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CircleDollarSign className="w-4 h-4 text-muted" />
                          <span className="font-medium">
                            {gameRewards(game.data.time)}
                          </span>
                        </div>
                      </div>
                    </section>
                  </section>
                ))}
              </section>
            </TabsContent>
          ))}
        </section>
      </Tabs>
    </main>
  );
}
