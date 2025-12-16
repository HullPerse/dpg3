import {
  CircleDollarSign,
  Clock,
  ExternalLink,
  Gamepad2,
  Star,
} from "lucide-react";
import type { RecordModel } from "pocketbase";
import { memo, useCallback, useMemo, useState } from "react";
import GamesApi from "@/api/games.api";
import LogsApi from "@/api/logs.api";
import Toast from "@/components/ui/toast.component";
import { cn, gameRewards } from "@/lib/utils";
import { useLoginStore } from "@/store/login.store";
import type { GameInterface, PresetType, StatusType } from "@/types/games";
import { Button } from "@/components/ui/button.component";
import { SmallLoader } from "@/components/ui/loader.components";
import { Image } from "@/components/shared/image.component";

type ItemCardProps = {
  game: PresetType["games"][0] | RecordModel;
  setOpen?: (open: boolean) => void;
};

const GameCard = ({ game, setOpen }: ItemCardProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const user = useLoginStore((state) => state.user);

  const handleAddGame = useCallback(async () => {
    setIsLoading(true);
    if (!user) {
      Toast("Вы не авторизованы", "error");
      setIsLoading(false);
      return;
    }

    try {
      const data = {
        user: {
          id: user.id,
          username: user.username,
        },
        data: {
          title: game.title,
          image: game.image,
          score: game.score,
          steam: game.steam,
          time: game.time,
          price: game.price,
        },
        status: "PLAYING" as StatusType,
        taken: false,
      };

      await new GamesApi().addGame(data as GameInterface);

      await new LogsApi().createLog({
        type: "newGame",
        sender: {
          id: user.id,
          username: user.username.toUpperCase(),
        },
        receiver: undefined,
        label: game.title,
        image: game.image,
      });

      Toast("Игра успешно добавлена", "success");
      setIsLoading(false);
      setOpen?.(false);
    } catch (error) {
      console.error("Ошибка при добавлении игры", error);
      Toast("ОШИБКА ПРИ ДОБАВЛЕНИИ ИГРЫ", "error");
      setIsLoading(false);
    }
  }, [user, game, setOpen]);

  const gameReward = useMemo(() => gameRewards(game.time), [game.time]);

  const handleSteamClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      window.open(game.steam, "_blank");
    },
    [game.steam],
  );

  const handleHltbClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      window.open(game.hltb, "_blank");
    },
    [game.hltb],
  );

  return (
    <main
      className={cn(
        "flex flex-col sm:flex-row gap-4 w-full max-w-2xl border border-primary/30 rounded",
        "bg-background",
        "min-h-[140px] h-fit p-5 transition-all duration-300",
        "cursor-pointer items-start justify-between",
        "relative overflow-hidden",
      )}
    >
      <div className="absolute inset-0 bg-background" />

      <section className="flex flex-col sm:flex-row gap-4 w-full relative z-10">
        {game.image && (
          <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 border border-primary/20 rounded overflow-hidden bg-background/60 group-hover:border-primary/40 transition-colors duration-300">
            <Image
              src={game.image}
              alt={game.title}
              loading="lazy"
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-colors duration-300 pointer-events-none" />
          </div>
        )}

        <section className="flex flex-col flex-1 gap-3">
          {game.title && (
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
              {game.title}
            </h3>
          )}

          <section className="flex flex-wrap gap-4 text-sm">
            {game.time && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 text-primary/70" />
                <span className="font-medium">{game.time}</span>
              </div>
            )}
            {game.score && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{game.score}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <CircleDollarSign className="w-4 h-4 text-muted" />
              <span className="font-medium">{gameReward}</span>
            </div>
          </section>

          <section className="flex flex-col sm:flex-row gap-2 mt-2">
            {game.steam && (
              <Button
                className="flex items-center gap-2 flex-1 sm:flex-none"
                onClick={handleSteamClick}
              >
                <Gamepad2 className="w-4 h-4" />
                Steam
                <ExternalLink className="w-3 h-3 opacity-70" />
              </Button>
            )}
            {game.hltb && (
              <Button
                className="flex items-center gap-2 flex-1 sm:flex-none"
                onClick={handleHltbClick}
              >
                <Clock className="w-4 h-4" />
                HLTB
                <ExternalLink className="w-3 h-3 opacity-70" />
              </Button>
            )}
          </section>
          <Button disabled={isLoading} onClick={handleAddGame}>
            {isLoading ? <SmallLoader /> : "ДОБАВИТЬ"}
          </Button>
        </section>
      </section>
    </main>
  );
};

export default memo(GameCard);
