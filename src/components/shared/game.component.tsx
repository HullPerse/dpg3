import { useParams } from "@tanstack/react-router";
import {
  Ban,
  Check,
  CircleDollarSign,
  Clock,
  Gamepad2,
  Globe,
  Play,
  RefreshCcw,
  RussianRuble,
  Star,
  Trash,
} from "lucide-react";
import type { RecordModel } from "pocketbase";
import { memo, Suspense, useState } from "react";
import GamesApi from "@/api/games.api";
import { Image } from "@/components/shared/image.component";
import { Button } from "@/components/ui/button.component";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/modal.component";
import { ModalLoading } from "@/components/ui/modal.state";
import { gameColor, gameRewards, getGameStatus } from "@/lib/utils";
import GameReview from "@/pages/profile/components/gameReview.component";
import GameStatus from "@/pages/profile/components/gameStatus.component";
import { useLoginStore } from "@/store/login.store";
import type { StatusType } from "@/types/games";

function GameCard({
  game,
  onUpdated,
}: Readonly<{ game: RecordModel; onUpdated?: () => void }>) {
  const [openStatus, setOpenStatus] = useState<StatusType | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const user = useLoginStore((state) => state.user);
  const params = useParams({ strict: false });

  return (
    <main className="relative flex flex-col w-3xl border border-primary rounded overflow-hidden">
      <section className="absolute top-1 right-1 z-50 flex flex-row gap-2">
        {game.status !== "COMPLETED" && (
          <Button
            size="icon"
            className="flex items-center justify-center text-center"
            onClick={() => setOpenStatus("COMPLETED")}
            hidden={user?.id !== params.id}
          >
            <Check className="w-4 h-4" />
          </Button>
        )}

        {game.status !== "PLAYING" && (
          <Button
            size="icon"
            className="flex items-center justify-center text-center"
            onClick={() => setOpenStatus("PLAYING")}
            hidden={user?.id !== params.id}
          >
            <Play className="w-4 h-4" />
          </Button>
        )}

        {game.status !== "DROPPED" && (
          <Button
            size="icon"
            className="flex items-center justify-center text-center"
            onClick={() => setOpenStatus("DROPPED")}
            hidden={user?.id !== params.id}
          >
            <Ban className="w-4 h-4" />
          </Button>
        )}

        {game.status !== "REROLL" && (
          <Button
            size="icon"
            className="flex items-center justify-center text-center"
            onClick={() => setOpenStatus("REROLL")}
            hidden={user?.id !== params.id}
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
        )}
        <Button
          size="icon"
          className="flex items-center justify-center text-center"
          onClick={() => setOpenDelete(true)}
          hidden={user?.id !== params.id}
        >
          <Trash className="w-4 h-4" />
        </Button>
      </section>

      <section className="relative h-[180px] w-full border-b border-primary overflow-hidden">
        <Image
          src={game.data.background || game.data.image}
          alt="game background"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-transparent backdrop-blur-xs pointer-events-none" />
        <h2 className="absolute bottom-0 left-0 p-4 text-2xl text-primary font-bold z-10">
          {game.data.title}
        </h2>
      </section>
      <section className="flex flex-row gap-2 w-full p-2">
        <div className="flex flex-col gap-2">
          <div className="relative min-w-[250px] w-[250px] max-w-[250px] min-h-30 h-30 max-h-30  border border-primary rounded overflow-hidden bg-background">
            <Image
              src={game.data.image}
              alt="game header"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="flex flex-row gap-2 items-center justify-center w-full max-h-fit border border-primary rounded p-2 flex-1">
            {new Array(5).fill(0).map((_, index) => (
              <Star
                key={index.toString()}
                className="w-8 h-8"
                style={{
                  fill:
                    index + 1 <= game.reviewRating
                      ? "var(--color-primary)"
                      : "",
                }}
              />
            ))}
          </div>
        </div>
        <section className="flex flex-col w-full p-2 items-start">
          {game.data.price && (
            <div className="flex flex-row text-primary gap-1 items-center">
              <CircleDollarSign className="w-5 h-5 text-primary/70" />
              <span className="font-bold">Цена:</span>
              <span>{game.data.price}</span>
            </div>
          )}
          <div className="flex flex-row text-primary gap-1 items-center">
            <Clock className="w-5 h-5 text-primary/70" />
            <span className="font-bold">Время прохождения:</span>
            <span>{game.data.time} часов</span>
          </div>
          <div className="flex flex-row text-primary gap-1 items-center">
            <RussianRuble className="w-5 h-5 text-primary/70" />
            <span className="font-bold">Чубрики:</span>
            <span>{gameRewards(game.data.time)}</span>
          </div>

          {(game.reviewText || game.reviewImage) && (
            <Suspense fallback={<ModalLoading />}>
              <GameReview
                game={game}
                canEdit={user?.id === params.id}
                onUpdated={onUpdated}
              />
            </Suspense>
          )}
        </section>
      </section>
      <section className="flex flex-row w-full justify-center items-center p-2 border-b gap-2">
        {game.data.website && (
          <Button
            className="flex items-center gap-2 flex-1"
            onClick={() => window.open(game.data.website, "_blank")}
          >
            <Globe className="w-4 h-4" />
            Вебсайт
          </Button>
        )}
        <Button
          className="flex items-center gap-2 flex-1"
          onClick={() => window.open(game.data.steam, "_blank")}
        >
          <Gamepad2 className="w-4 h-4" />
          Стим
        </Button>
      </section>
      <section className="flex flex-row w-full justify-between p-2">
        <span
          className="rounded border bg-primary/10 px-2 py-1 text-xs font-medium text-center"
          style={{
            color: gameColor(game.status),
          }}
        >
          {getGameStatus(game.status)}
        </span>
        <span className="text-muted">
          {new Date(game.created).toLocaleDateString("ru-RU")}
        </span>
      </section>

      {openStatus && (
        <GameStatus
          game={game}
          targetStatus={openStatus}
          open={!!openStatus}
          onOpenChange={(v) => setOpenStatus(v ? openStatus : null)}
          onUpdated={onUpdated}
        />
      )}

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="border border-primary text-primary">
          <DialogHeader>
            <DialogTitle className="text-primary">
              Удалить игру из коллекции?
            </DialogTitle>
            <DialogDescription className="text-primary">
              Это действие нельзя отменить. Игра будет удалена из вашей
              коллекции.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setOpenDelete(false)}>Отмена</Button>
            <Button
              onClick={async () => {
                await new GamesApi().deleteGame(game.id);
                setOpenDelete(false);
                onUpdated?.();
              }}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default memo(GameCard);
