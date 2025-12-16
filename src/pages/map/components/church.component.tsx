import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign, Clock, Star, X } from "lucide-react";
import { memo, useCallback, useState } from "react";
import GamesApi from "@/api/games.api";
import { Image } from "@/components/shared/image.component";
import { Button } from "@/components/ui/button.component";
import Input from "@/components/ui/input.component";
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
import { gameRewards } from "@/lib/utils";
import { useLoginStore } from "@/store/login.store";
import type { GameInterface, StatusType } from "@/types/games";
import UsersApi from "@/api/users.api";

const gamesApi = new GamesApi();
const usersApi = new UsersApi();

const Church = memo(
  ({
    setIsOpen,
  }: Readonly<{
    setIsOpen: (isOpen: boolean) => void;
  }>) => {
    const queryClient = useQueryClient();
    const user = useLoginStore((state) => state.user);

    const [searchQuery, setSearchQuery] = useState("");
    const [addingGame, setAddingGame] = useState(false);

    const { data, isLoading, isError } = useQuery({
      queryKey: ["church"],
      queryFn: async () => {
        return (await gamesApi
          .getGames()
          .then((data) =>
            data
              .filter((game) => !game.taken)
              .filter(
                (game) =>
                  game.status === "COMPLETED" || game.status === "DROPPED",
              ),
          )) as GameInterface[];
      },
    });

    const invalidateItemList = useCallback(() => {
      queryClient.invalidateQueries({
        queryKey: ["church"],
        refetchType: "all",
      });
    }, [queryClient]);

    useSubscription("games", "*", invalidateItemList);
    useSubscription("users", "*", invalidateItemList);

    const filteredGames =
      data?.filter((game) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const title = (game.data.title as string) || "";
        return title.toLowerCase().includes(query);
      }) || [];

    const handleAddGame = useCallback(
      async (game: GameInterface) => {
        setAddingGame(true);

        const data = {
          user: {
            id: String(user?.id),
            username: String(user?.username),
          },
          data: game.data,
          status: "PLAYING" as StatusType,
          taken: true,
        };

        await gamesApi.addGame(data);
        await gamesApi.changeTaken(String(game.id), true);
        await usersApi.changeChurch(String(user?.id), true);

        setAddingGame(false);
        setIsOpen(false);
      },
      [user, setIsOpen],
    );

    if (isLoading) return <ModalLoading />;
    if (isError) return <ModalError />;

    return (
      <DialogContent
        className="flex flex-col gap-4 border-2 border-primary rounded bg-background/95 backdrop-blur-sm p-6 text-primary"
        style={{
          width: "820px",
          maxWidth: "95vw",
          height: "670px",
          minHeight: "400px",
          maxHeight: "90vh",
        }}
        showCloseButton={false}
      >
        <DialogHeader className="text-primary relative border-b border-primary/20 pb-4">
          <DialogClose
            className="absolute right-0 top-0 rounded opacity-70 hover:opacity-100 hover:bg-accent transition-colors cursor-pointer p-2"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogTitle className="text-center text-xl font-bold tracking-wider">{`> ЦЕРКОВЬ <`}</DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            Можете забрать любую одну игру
          </DialogDescription>
        </DialogHeader>

        <main className="flex flex-col gap-2 w-full overflow-y-auto">
          <Input
            type="text"
            placeholder="Поиск предметов"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10"
            autoFocus
          />

          {filteredGames
            ?.filter((game) => game.data.title)
            .map((game) => (
              <section
                key={game.id}
                className="relative flex flex-row text-primary border border-primary rounded items-ceneter p-2 gap-2 font-bold"
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
                        <span className="font-medium">{game.data.time}</span>
                      </div>
                    )}
                    {!!game.data.score && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{game.data.score}</span>
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

                <Button
                  className="absolute right-1 bottom-1"
                  onClick={() => handleAddGame(game)}
                  disabled={isLoading || addingGame}
                >
                  {addingGame ? <SmallLoader /> : "Добавить"}
                </Button>
              </section>
            ))}
        </main>
      </DialogContent>
    );
  },
);

export default Church;
