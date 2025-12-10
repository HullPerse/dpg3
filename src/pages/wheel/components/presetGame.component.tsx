import { CircleDollarSign, Clock, Plus, Star } from "lucide-react";
import { useEffect, useState } from "react";
import GamesApi from "@/api/games.api";
import { Image } from "@/components/shared/image.component";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.components";
import { gameRewards } from "@/lib/utils";
import AddCustom from "@/pages/wheel/components/addCustom.component";
import AddSteam from "@/pages/wheel/components/addSteam.component";
import type { GameType } from "@/types/games";

export default function PresetGame({
  setOpen,
  id,
  preset,
}: Readonly<{
  setOpen: (open: boolean) => void;
  id: string;
  preset: GameType[];
}>) {
  const [isLoading, setIsLoading] = useState(false);
  const [renderedGames, setRenderedGames] = useState<GameType[]>(preset);
  const [openEdit, setOpenEdit] = useState(false);

  const editPreset = (game: GameType) => {
    setRenderedGames((prev) => [...prev, game]);
  };

  const handleSave = async () => {
    setIsLoading(true);

    new GamesApi().changePreset(id, renderedGames);
    setIsLoading(false);
    setOpen(false);
  };

  useEffect(() => {
    setRenderedGames(preset);
  }, [preset]);

  return (
    <main className="flex flex-col gap-2 w-full items-center">
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
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
                <AddSteam setOpen={setOpenEdit} setEdit={editPreset} />
              </TabsContent>
              <TabsContent value="customGame">
                <AddCustom setOpen={setOpenEdit} setEdit={editPreset} />
              </TabsContent>
            </Tabs>
          </section>
        </DialogContent>
      </Dialog>
      <Button
        className="w-3xl"
        onClick={handleSave}
        disabled={isLoading || preset === renderedGames}
      >
        {isLoading ? <SmallLoader /> : "Сохранить пресет"}
      </Button>
      <section className="flex flex-col gap-2">
        {renderedGames.length > 0 &&
          renderedGames.map((game) => (
            <section
              key={game.title}
              className="flex flex-row text-primary w-3xl border border-primary rounded items-ceneter p-2 gap-2 font-bold"
            >
              {game.image && (
                <div className="relative shrink-0">
                  <div className="relative rounded border border-border/40 bg-muted/40 p-1 transition-colors">
                    <Image
                      src={game.image}
                      alt={game.title}
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
                <span className="text-start">{game.title}</span>
                <div className="flex flex-wrap gap-4 text-sm">
                  {!!game.time && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary/70" />
                      <span className="font-medium">{game.time}</span>
                    </div>
                  )}
                  {!!game.score && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{game.score}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CircleDollarSign className="w-4 h-4 text-muted" />
                    <span className="font-medium">
                      {gameRewards(game.time)}
                    </span>
                  </div>
                </div>
              </section>
            </section>
          ))}
      </section>
    </main>
  );
}
