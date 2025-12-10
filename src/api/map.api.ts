import { legendaryPoop, regularPoop } from "@/config/items.config";
import type { cellsType } from "@/types/map";
import { client } from "./client.api";
import LogsApi from "./logs.api";
import UsersApi from "./users.api";

export default class MapApi {
  takeCell = async (data: cellsType, jail: boolean) => {
    await client.collection("cells").create({
      level: data.level,
      name: data.name,
      user: {
        userId: data.user.userId,
        username: data.user.username,
      },
    });

    const usersApi = new UsersApi();

    await usersApi.changeJail(data.user.userId, jail);

    await usersApi.changeMoney(data.user.userId, data.reward.money);

    const logsApi = new LogsApi();

    await logsApi.createLog({
      type: "takeCell",
      sender: {
        id: data.user.userId,
        username: data.user.username.toUpperCase(),
      },
      label: data.name,
    });
  };

  dropCell = async (
    id: string,
    position: "left" | "right" | "top" | "bottom",
    cell: number,
    cellName: string,
  ) => {
    const [startCell, firstJail, secondJail] = [0, 10, 30];
    const targetJail = () => {
      if (cell === secondJail) return firstJail;
      if (cell === firstJail) return startCell;
      if (cell === startCell) return startCell;
      if (position === "left") return startCell;
      if (position === "top" || position === "right") return firstJail;
      if (position === "bottom") return secondJail;
      return startCell;
    };

    let jailCellId = targetJail();
    if (cell === firstJail || cell === secondJail) {
      jailCellId = cell;
    }

    const usersApi = new UsersApi();

    await usersApi.changeJail(id, jailCellId !== startCell);

    const user = await client.collection("users").getOne(id, {
      fields: "username",
    });

    const logsApi = new LogsApi();

    await logsApi.createLog({
      type: "dropCell",
      sender: {
        id: id,
        username: user.username.toUpperCase(),
      },
      label: cellName,
    });
    const CellData = await usersApi.getJson("map");

    const jailCell = CellData.find(
      (c: { id: number; label: string }) => c.id === jailCellId,
    );
    const jailCellName = jailCell?.label || "Тюрьма";

    return await usersApi.moveTarget(
      id,
      jailCellId,
      0,
      jailCellName,
      undefined,
      false,
    );
  };

  getCellInfo = async () => {
    return await client.collection("cells").getFullList();
  };

  getSingleCell = async (label: string) => {
    return await client.collection("cells").getFullList({
      filter: `name = "${label}"`,
    });
  };

  poopCell = async (userId: string, level: number, name: string) => {
    await client.collection("cells").create({
      level: level,
      name: name,
      user: null,
      poop: true,
    });

    const poopItems = await client.collection("inventory").getFullList({
      filter: `userId = "${userId}" && itemId = "${regularPoop}"`,
    });

    if (poopItems?.[0]?.id) {
      await client.collection("inventory").delete(poopItems[0].id);
    }
  };

  legendaryPoopCell = async (userId: string, level: number, name: string) => {
    await client.collection("cells").create({
      level: level,
      name: name,
      user: null,
      poop: true,
    });

    const poopItems = await client.collection("inventory").getFullList({
      filter: `userId = "${userId}" && itemId = "${legendaryPoop}"`,
    });

    if (poopItems) {
      await client.collection("inventory").delete(poopItems[0].id);
    }
  };

  removePoop = async (label: string) => {
    const getSinglePoop = await client.collection("cells").getFullList({
      filter: `name = "${label}" && poop = true`,
    });
    if (getSinglePoop.length === 0) return;

    return await client.collection("cells").delete(getSinglePoop[0].id);
  };

  isPooped = async (label: string) => {
    return this.getSingleCell(label).then((res) =>
      res.some((cell) => cell.poop),
    );
  };
}
