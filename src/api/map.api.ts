import { legendaryPoop, regularPoop } from "@/config/items.config";
import type { cellsType } from "@/types/map";
import { client } from "./client.api";

import ItemsApi from "./items.api";
import LogsApi from "./logs.api";
import UsersApi from "./users.api";

export default class MapApi {
  private readonly mapCollection = client.collection("cells");

  private readonly usersApi: UsersApi;
  private readonly logsApi: LogsApi;
  private readonly itemsApi: ItemsApi;

  constructor(usersApi?: UsersApi, logsApi?: LogsApi, itemsApi?: ItemsApi) {
    this.usersApi = usersApi || new UsersApi(undefined, undefined, this);
    this.logsApi = logsApi || new LogsApi();
    this.itemsApi = itemsApi || new ItemsApi();
  }

  takeCell = async (data: cellsType, jail: boolean) => {
    await this.mapCollection.create({
      level: data.level,
      name: data.name,
      user: {
        userId: data.user.userId,
        username: data.user.username,
      },
    });

    await this.usersApi.changeJail(data.user.userId, jail);

    await this.usersApi.changeMoney(data.user.userId, data.reward.money);

    await this.logsApi.createLog({
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
    log?: boolean,
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

    await this.usersApi.changeJail(id, jailCellId !== startCell);

    const user = await this.usersApi.getUsernameById(id);

    if (log) {
      await this.logsApi.createLog({
        type: "dropCell",
        sender: {
          id: id,
          username: user.username.toUpperCase(),
        },
        label: cellName,
      });
    }

    const CellData = await this.usersApi.getJson("map");

    const jailCell = CellData.find(
      (c: { id: number; label: string }) => c.id === jailCellId,
    );
    const jailCellName = jailCell?.label || "Тюрьма";

    return await this.usersApi.moveTarget(
      id,
      jailCellId,
      0,
      jailCellName,
      undefined,
      false,
    );
  };

  getCellInfo = async () => {
    return await this.mapCollection.getFullList();
  };

  getSingleCell = async (label: string) => {
    return await this.mapCollection.getFullList({
      filter: `name = "${label}"`,
    });
  };

  poopCell = async (userId: string, level: number, name: string) => {
    await this.mapCollection.create({
      level: level,
      name: name,
      user: null,
      poop: true,
    });

    const poopItems = await this.itemsApi.getInventoryItems(
      userId,
      regularPoop,
    );

    if (poopItems) await this.itemsApi.removeInventoryItem(poopItems[0].id);
  };

  legendaryPoopCell = async (userId: string, level: number, name: string) => {
    await this.mapCollection.create({
      level: level,
      name: name,
      user: null,
      poop: true,
    });

    const poopItems = await this.itemsApi.getInventoryItems(
      userId,
      legendaryPoop,
    );

    if (poopItems) await this.itemsApi.removeInventoryItem(poopItems[0].id);
  };

  removePoop = async (label: string) => {
    const getSinglePoop = await this.mapCollection.getFullList({
      filter: `name = "${label}" && poop = true`,
    });
    if (getSinglePoop.length === 0) return;

    return await this.mapCollection.delete(getSinglePoop[0].id);
  };

  isPooped = async (label: string) => {
    return this.getSingleCell(label).then((res) =>
      res.some((cell) => cell.poop),
    );
  };
}
