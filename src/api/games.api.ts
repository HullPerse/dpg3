import type { GameInterface, GameType, UpdateGamePayload } from "@/types/games";
import { client } from "./client.api";
import LogsApi from "./logs.api";

export default class GamesApi {
  private readonly gamesCollection = client.collection("games");
  private readonly presetsCollection = client.collection("presets");

  //GAMES
  getSteamGame = async (appId: string) => {
    const id = appId.trim();

    if (!id) {
      return { success: false, message: "Укажите ID игры Steam" };
    }

    const targetURL =
      "https://cors-anywhere.com/" +
      `https://store.steampowered.com/api/appdetails?appids=${id}`;

    try {
      const res = await fetch(targetURL);
      if (!res.ok) {
        return { success: false, message: `Ошибка запроса: ${res.status}` };
      }

      const json = await res.json();
      const entry = json?.[id];

      if (!entry?.success || !entry?.data) {
        return { success: false, message: "Игра не найдена" };
      }

      const data = entry.data as Record<string, unknown> & {
        background_raw?: string;
      };

      return {
        success: true,
        data,
        message: "Игра найдена",
      } as const;
    } catch {
      return { success: false, message: "Ошибка" };
    }
  };

  addGame = async (data: GameInterface) => {
    await this.gamesCollection.create(data);

    return await new LogsApi().createLog({
      type: "newGame",
      sender: {
        id: data.user.id,
        username: data.user.username,
      },
      receiver: undefined,
      label: data.data.title,
      image: data.data.image,
    });
  };

  deleteGame = async (id: string) => {
    return await this.gamesCollection.delete(id);
  };

  updateGame = async (id: string, payload: UpdateGamePayload) => {
    const hasFile = payload.reviewImage instanceof File;
    const needsFormData =
      hasFile ||
      typeof payload.data === "object" ||
      payload.reviewText === null ||
      payload.reviewRating === null ||
      payload.reviewImage === null;

    if (needsFormData) {
      const formData = new FormData();

      if (payload.status) formData.append("status", payload.status);

      if (payload.reviewText !== undefined) {
        if (payload.reviewText === null) {
          formData.append("reviewText", "");
        } else if (typeof payload.reviewText === "string") {
          formData.append("reviewText", payload.reviewText);
        }
      }

      if (payload.reviewRating !== undefined) {
        if (payload.reviewRating === null) {
          formData.append("reviewRating", "");
        } else if (typeof payload.reviewRating === "number") {
          formData.append("reviewRating", String(payload.reviewRating));
        }
      }

      if (payload.data)
        formData.append(
          "data",
          JSON.stringify(payload.data as unknown as object),
        );

      if (payload.reviewImage !== undefined) {
        if (payload.reviewImage === null) {
          formData.append("reviewImage", "");
        } else if (hasFile) {
          formData.append("reviewImage", payload.reviewImage as File);
        }
      }

      return await this.gamesCollection.update(id, formData);
    }

    const jsonPayload: Record<string, unknown> = {};

    if (payload.status !== undefined) jsonPayload.status = payload.status;
    if (payload.reviewText !== undefined) {
      jsonPayload.reviewText = payload.reviewText ?? "";
    }
    if (payload.reviewRating !== undefined) {
      jsonPayload.reviewRating = payload.reviewRating ?? null;
    }
    if (payload.data !== undefined) jsonPayload.data = payload.data;
    if (payload.reviewImage === null) jsonPayload.reviewImage = "";

    return await this.gamesCollection.update(id, jsonPayload);
  };

  getGames = async () => {
    return await this.gamesCollection.getFullList();
  };

  getGamesByUser = async (id: string) => {
    return await this.gamesCollection.getFullList({
      filter: `user.id = "${id}"`,
    });
  };

  changeTaken = async (id: string, taken: boolean) => {
    return await this.gamesCollection.update(id, {
      taken: taken,
    });
  };

  //PRESETS
  getPresets = async () => {
    return await this.presetsCollection.getFullList();
  };

  changePreset = async (id: string, games: GameType[]) => {
    return await this.presetsCollection.update(id, {
      games: games,
    });
  };

  createPreset = async (label: string, games: GameType[]) => {
    return await this.presetsCollection.create({
      label,
      games,
    });
  };
}
