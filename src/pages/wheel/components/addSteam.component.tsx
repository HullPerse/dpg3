import { Search } from "lucide-react";
import { useRef, useState } from "react";

import GamesApi from "@/api/games.api";
import { Image } from "@/components/shared/image.component";
import { Button } from "@/components/ui/button.component";
import Input from "@/components/ui/input.component";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import Toast from "@/components/ui/toast.component";
import { gameRewards } from "@/lib/utils";
import type { GameType } from "@/types/games";

type SteamGameResponse = {
  steam_appid: string;
  name: string;
  header_image: string;
  website?: string;
  background_raw?: string;
  price_overview?: { final_formatted?: string };
  recommendations?: { total?: number };
};

type SteamGameApiSuccess = {
  success: true;
  data: SteamGameResponse;
  message: string;
};

type SteamGameApiError = {
  success: false;
  message: string;
};

export default function AddSteam({
  setOpen,
  setEdit,
}: Readonly<{
  setOpen: (open: boolean) => void;
  setEdit?: (game: GameType) => void;
}>) {
  const [game, setGame] = useState<SteamGameResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState<number>(0);

  const appIdRef = useRef<HTMLInputElement>(null);
  const appTimeRef = useRef<HTMLInputElement>(null);

  const isValid = !!game && Number(appTimeRef.current?.value ?? 0) > 0;

  const onSearch = async () => {
    const id = appIdRef.current?.value.trim();
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const gameData = (await new GamesApi().getSteamGame(id)) as
        | SteamGameApiSuccess
        | SteamGameApiError;
      if (gameData.success) {
        setGame(gameData.data);
      } else {
        setError(gameData.message ?? "Ошибка при поиске игры");
        setGame(null);
      }
    } catch {
      setError("Ошибка при поиске игры");
      setGame(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGame = async () => {
    if (!game || Number(appTimeRef.current?.value ?? 0) <= 0) {
      Toast("Укажите время прохождения", "error");
      return;
    }

    const payload = {
      title: game.name,
      image: game.header_image,
      score: game.recommendations?.total ?? 0,
      steam: `https://store.steampowered.com/app/${game.steam_appid}`,
      website: game.website || "",
      time: Number(appTimeRef.current?.value) || 0,
      price: game.price_overview?.final_formatted?.toString() ?? "Free",
      background: game.background_raw || "",
    };

    setEdit?.(payload as GameType);

    setOpen(false);
    setGame(null);
    setTime(0);
    if (appIdRef.current) appIdRef.current.value = "";
    if (appTimeRef.current) appTimeRef.current.value = "";
  };

  const getPriceDisplay = () => {
    return game?.price_overview?.final_formatted || "Free";
  };

  return (
    <main className="flex flex-col gap-4 p-2 ">
      <section className="flex w-full gap-1 items-center">
        <div className="flex-1">
          <Input
            placeholder="SteamID"
            ref={appIdRef}
            type="number"
            className="w-full"
            autoFocus={true}
          />
        </div>
        <Button className="shrink-0" onClick={onSearch} disabled={loading}>
          <Search />
        </Button>
      </section>

      {game && (
        <section className="flex w-full gap-1 items-center">
          <div className="flex-1">
            <Input
              placeholder="Время прохождения"
              ref={appTimeRef}
              type="number"
              className="w-full"
              onChange={(e) => setTime(Number(e.target.value) || 0)}
            />
          </div>
        </section>
      )}

      {loading && <ModalLoading />}

      {error && <ModalError description={error} />}

      {game && (
        <section className="flex flex-col gap-2 items-center">
          <span className="text-lg font-bold text-primary">{game.name}</span>
          <div className="border border-primary rounded overflow-hidden aspect-video max-w-full">
            <Image
              src={game.header_image}
              className="w-full h-full object-cover"
              alt={game.name}
              loading="lazy"
            />
          </div>
          <section className="flex flex-row w-full h-full justify-center">
            <span className="flex justify-center w-full text-primary">
              [{gameRewards(time)}] Чубриков
            </span>
            <span className="flex justify-end w-full text-primary">
              [{getPriceDisplay()}]
            </span>
          </section>

          <section className="flex flex-row items-center justify-center gap-1 w-full">
            {game.website && (
              <Button
                variant={"default"}
                className="w-1/2"
                onClick={() => {
                  window.open(game.website);
                }}
              >
                Вебсайт
              </Button>
            )}
            <Button
              variant={"default"}
              className={game.website ? "w-1/2" : "w-full"}
              onClick={() => {
                window.open(
                  `https://store.steampowered.com/app/${game.steam_appid}`,
                );
              }}
            >
              Steam
            </Button>
          </section>

          <Button
            className="w-full"
            disabled={!isValid}
            onClick={handleAddGame}
          >
            Добавить
          </Button>
        </section>
      )}
    </main>
  );
}
