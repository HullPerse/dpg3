import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import {
  lazy,
  Suspense,
  startTransition,
  useCallback,
  useRef,
  useState,
} from "react";
import GamesApi from "@/api/games.api";
import { Button } from "@/components/ui/button.component";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/modal.component";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.components";
import { useSubscription } from "@/hooks/useSubscription";
import AddCustom from "@/pages/wheel/components/addCustom.component";
import AddSteam from "@/pages/wheel/components/addSteam.component";
import { useLoginStore } from "@/store/login.store";
import type { GameType } from "@/types/games";

const GameCard = lazy(() => import("@/components/shared/game.component"));

export default function Games() {
  const params = useParams({ strict: false });
  const queryClient = useQueryClient();
  const user = useLoginStore((state) => state.user);

  const [open, setOpen] = useState<boolean>(false);

  const listRef = useRef<HTMLDivElement>(null);

  const { data, isError, isLoading } = useQuery({
    queryKey: ["userGames", params.id],
    queryFn: async () => {
      if (!params.id) return undefined;

      const gameData = (
        await new GamesApi().getGamesByUser(params.id)
      ).reverse();

      return gameData;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const invalidateQuery = useCallback(() => {
    if (params.id) {
      startTransition(() => {
        queryClient.invalidateQueries({
          queryKey: ["userGames", params.id],
          refetchType: "all",
        });
      });
    }
  }, [queryClient, params.id]);

  useSubscription("games", "*", invalidateQuery);

  const handleAddGame = async (game: GameType) => {
    if (!game) return;

    const gameData = {
      title: game.title,
      image: game.image,
      score: game.score,
      steam: game.steam,
      website: game.website,
      time: game.time,
      price: game.price,
      background: game.background,
    };

    await new GamesApi().addGame({
      user: {
        id: user?.id as string,
        username: user?.username as string,
      },
      data: gameData,
      status: "PLAYING",
    });
  };

  if (isLoading) return <ModalLoading />;
  if (isError) return <ModalError />;

  return (
    <main className="flex flex-col w-full items-center h-full">
      <section className="w-2xl items-center flex justify-center p-2">
        {user && user.id === params.id && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-3xl h-[90px] border border-primary rounded opacity-70 hover:opacity-100 transition-all duration-20 cursor-pointer">
                <Plus className="h-full w-full" />
              </Button>
            </DialogTrigger>
            <DialogContent className="flex flex-col gap-4 border border-primary rounded max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader hidden>
                <DialogTitle></DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>
              <section className="text-primary">
                <Tabs defaultValue="steamGame" className="w-full">
                  <TabsList className="h-auto w-full flex max-lg:flex-col gap-2 rounded-lg bg-background/50 backdrop-blur-sm p-1.5 border border-border/50 shadow-sm">
                    <TabsTrigger
                      value="steamGame"
                      className="rounded w-full transition-all duration-200 hover:bg-primary/10 data-[state=active]:bg-primary/30 data-[state=active]:shadow-md cursor-pointer"
                    >
                      SteamID
                    </TabsTrigger>
                    <TabsTrigger
                      value="customGame"
                      className="rounded w-full transition-all duration-200 hover:bg-primary/10 data-[state=active]:bg-primary/30 data-[state=active]:shadow-md cursor-pointer"
                    >
                      Новая игра
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="steamGame">
                    <Suspense fallback={<ModalLoading />}>
                      <AddSteam setOpen={setOpen} setEdit={handleAddGame} />
                    </Suspense>
                  </TabsContent>
                  <TabsContent value="customGame">
                    <Suspense fallback={<ModalLoading />}>
                      <AddCustom setOpen={setOpen} setEdit={handleAddGame} />
                    </Suspense>
                  </TabsContent>
                </Tabs>
              </section>
            </DialogContent>
          </Dialog>
        )}
      </section>

      <div
        ref={listRef}
        className="flex flex-col flex-1 w-full overflow-auto gap-2"
      >
        {data?.map((item) => {
          return (
            <div key={item.id} className="w-full flex justify-center">
              {item && <GameCard game={item} onUpdated={invalidateQuery} />}
            </div>
          );
        })}
      </div>
    </main>
  );
}
