import { poopBoots, regularPoop } from "@/config/items.config";
import { getCellLevel, getVending } from "@/lib/utils";
import type { LogType } from "@/types/log";
import type { MapCellsType } from "@/types/map";
import type { CreateUser, JsonRecord, User } from "@/types/users";
import { client, itemImage } from "./client.api";

import ItemsApi from "./items.api";
import LogsApi from "./logs.api";
import MapApi from "./map.api";

export default class UsersApi {
  private readonly usersCollection = client.collection("users");
  private readonly itemsCollection = client.collection("items");
  private readonly inventoryCollection = client.collection("inventory");
  private readonly jsonCollection = client.collection("json");

  private readonly logsApi: LogsApi;
  private readonly itemsApi: ItemsApi;
  private readonly mapApi: MapApi;

  constructor(logsApi?: LogsApi, itemsApi?: ItemsApi, mapApi?: MapApi) {
    this.logsApi = logsApi || new LogsApi();
    this.itemsApi = itemsApi || new ItemsApi();
    this.mapApi = mapApi || new MapApi(this);
  }

  createUser = async (data: CreateUser) => {
    const allUsers = await this.getExistingUsers();

    try {
      const usernameExists = allUsers.some(
        (user) => user.username.toUpperCase() === data.username.toUpperCase(),
      );
      const colorExists = allUsers.some((user) => user.color === data.color);
      const avatarExists = allUsers.some((user) => user.avatar === data.avatar);

      if (usernameExists || colorExists || avatarExists) {
        throw new Error("Имя пользователя, цвет или аватар уже заняты");
      }

      const userData = {
        username: data.username.toUpperCase(),
        password: data.password,
        passwordConfirm: data.confirmPassword,
        avatar: data.avatar,
        color: data.color,
        email: `${data.username.toUpperCase()}@notEmail.com`,
        admin: data.username.toUpperCase() === "HULLPERSE",
        vendingMachine: getVending(),
        data: {
          money: {
            current: 0,
            total: 0,
          },
          cell: 0,
          totalFinish: 0,
        },
      };

      await this.usersCollection.create(userData);
    } catch (error) {
      console.error("Ошибка при создании пользователя:", error);
      throw error;
    }
  };

  getUsers = async () => {
    return await this.usersCollection.getFullList();
  };

  getExistingUsers = async () => {
    return await this.usersCollection.getFullList({
      fields: "username, avatar, color, id",
    });
  };

  getUserById = async (id: string) => {
    return await this.usersCollection.getOne(id);
  };

  getUsernameById = async (id: string) => {
    return await this.usersCollection.getOne(id, {
      fields: "username",
    });
  };

  getMoney = async (id: string) => {
    return await this.usersCollection.getOne(id, {
      fields: "data",
    });
  };

  changeMoney = async (id: string, money: number, finish?: number) => {
    const user = await this.usersCollection.getOne(id, {
      fields: "data",
    });

    const currentMoney = (user.data as User["data"]).money.current;
    const totalMoney = (user.data as User["data"]).money.total;
    const currentCell = (user.data as User["data"]).cell;
    const totalFinish = (user.data as User["data"]).totalFinish;

    return await this.usersCollection.update(id, {
      data: {
        money: {
          current: currentMoney + money,
          total: money > 0 ? totalMoney + money : totalMoney,
        },
        cell: currentCell,
        totalFinish: finish ? totalFinish + finish : totalFinish,
      },
    });
  };

  addItem = async (userId: string, itemId: string, charge?: number | null) => {
    let itemCharge: number | null;

    if (charge === undefined) {
      const item = await this.itemsCollection.getOne(itemId, {
        fields: "label, image, id, charge",
      });
      itemCharge = item.charge ?? null;
    } else {
      itemCharge = charge;
    }

    const item = await this.itemsCollection.getOne(itemId, {
      fields: "label, image, id",
    });

    await this.inventoryCollection.create({
      userId: userId,
      itemId: itemId,
      charge: itemCharge,
    });

    const user = await this.usersCollection.getOne(userId, {
      fields: "username",
    });

    const logData = {
      username: user.username.toUpperCase(),
      type: "newItem" as LogType["type"],
      image: `${itemImage}${item.id}/${item.image}`,
    };

    return await this.logsApi.createLog({
      type: logData.type,
      sender: {
        id: userId,
        username: user.username.toUpperCase(),
      },
      receiver: undefined,
      label: item.label,
      image: logData.image,
    });
  };

  removeItem = async (
    id: string,
    userId?: string,
    image?: string,
    label?: string,
  ) => {
    await this.inventoryCollection.delete(id);

    if (!userId) return;

    const user = await this.usersCollection.getOne(userId, {
      fields: "username",
    });

    const logData = {
      username: user.username.toUpperCase(),
      type: "newItem" as LogType["type"],
      image: `${itemImage}${id}/${image}`,
    };

    return await this.logsApi.createLog({
      type: logData.type,
      sender: {
        id: userId,
        username: user.username.toUpperCase(),
      },
      receiver: undefined,
      label: label,
      image: logData.image,
    });
  };

  changeCharges = async (inventoryId: string, charge: number) => {
    return await this.inventoryCollection.update(inventoryId, {
      charge: charge,
    });
  };

  getStats = async (id: string) => {
    return await this.usersCollection.getFirstListItem(`id = "${id}"`, {
      fields: "id, username, avatar, color, data",
    });
  };

  moveTarget = async (
    userId: string,
    target: number,
    tax: number,
    cellName?: string,
    allOwners?: string[],
    steppedOnPoop?: boolean,
    finishAmount?: number,
  ) => {
    const user = await this.getUserById(userId);
    const inventory = await this.itemsApi.getInventory(userId);

    const userSkis = inventory.find((item) => item.itemId === regularPoop);
    const userBoots = inventory.find((item) => item.itemId === poopBoots);

    if (userSkis) {
      const cells = await this.getJson("map");
      const currentCell = cells.find((cell) => cell.id === user.data.cell);

      if (!currentCell) return;

      const resultCells = () => {
        if (currentCell.id < target) {
          return cells.filter(
            (cell) => cell.id >= currentCell.id && cell.id < target,
          );
        }
        return cells.filter(
          (cell) => cell.id <= currentCell.id && cell.id > target,
        );
      };

      for (const cell of resultCells()) {
        const cellPooped = await this.mapApi
          .getSingleCell(cell.label)
          .then((res) => res.some((cell) => cell.poop));

        if (cellPooped) continue;
        const level = getCellLevel(cell.difficulty);
        await this.mapApi.poopCell(userId, level, cell.label);
      }

      await this.removeItem(
        userSkis.id,
        userId,
        userSkis.image,
        userSkis.label,
      );
    }

    if (steppedOnPoop && cellName) {
      if (!userBoots) {
        await this.changePooped(userId, true);
      }

      await this.mapApi.removePoop(cellName);
      if (userBoots)
        await this.removeItem(
          userBoots.id,
          userId,
          userBoots.image,
          userBoots.label,
        );
    }

    const currentData = {
      totalFinish:
        (user.data as User["data"]).totalFinish + (finishAmount ?? 0),
      cell: target,
      money: {
        current:
          (user.data as User["data"]).money.current -
          tax +
          (finishAmount && finishAmount > 0 ? finishAmount * 500 : 0),
        total: (user.data as User["data"]).money.total,
      },
    };

    await this.usersCollection.update(user.id, {
      data: currentData,
    });

    if (allOwners && Number.isFinite(tax) && tax > 0) {
      const taxPerOwner = Math.floor(tax / allOwners.length);
      if (taxPerOwner > 0) {
        for (const owner of allOwners) {
          await this.changeMoney(owner, taxPerOwner);
        }
      }
    }

    await this.logsApi.createLog({
      type: "moveUser",
      sender: {
        id: userId,
        username: user.username.toUpperCase(),
      },
      receiver: undefined,
      label: cellName ? `клетку ${cellName}` : `клетку ${target}`,
      image: undefined,
    });
  };

  changePooped = async (id: string, pooped: boolean) => {
    await this.usersCollection.update(id, {
      isPooped: pooped,
    });
  };

  itemAvailability = async (userId: string, itemId: string) => {
    const result = await this.inventoryCollection.getFullList({
      filter: `userId = "${userId}" && itemId = "${itemId}"`,
    });

    return result.length > 0;
  };

  changeJail = async (id: string, status: boolean) => {
    return await this.usersCollection.update(id, {
      jailStatus: status,
    });
  };

  changeVending = async (id: string) => {
    return await this.usersCollection.update(id, {
      vendingMachine: getVending(),
    });
  };

  changeTrash = async (id: string, trash: boolean) => {
    return await this.usersCollection.update(id, {
      trash: trash,
    });
  };

  exchangeItems = async (
    targetId: string,
    items: Array<{
      itemId: string;
      charge: number;
      instanceId: string;
    }>,
  ) => {
    for (const item of items) {
      await this.addItem(targetId, item.itemId, item.charge);

      await this.removeItem(item.instanceId);
    }
  };

  //-------------------
  // WARNING: This works better in terms of performance, but since i wont exchange more than ~30 items at once, i will use cleaner version
  //-------------------
  // exchangeItems = async (
  //   targetId: string,
  //   items: Array<{
  //     itemId: string;
  //     charge: number;
  //     instanceId: string;
  //   }>,
  // ) => {
  // await Promise.all(
  //   items.map((item) =>
  //     this.inventoryCollection.create({
  //       itemId: item.itemId,
  //       userId: targetId,
  //       charge: item.charge,
  //     }),
  //   ),
  // );

  // await Promise.all(
  //   items.map((item) =>
  //     this.inventoryCollection.delete(item.instanceId),
  //   ),
  // );
  // };
  //-------------------

  getJson = async (type: "map"): Promise<MapCellsType[]> => {
    const data = await this.jsonCollection.getFullList<JsonRecord>({
      filter: `type = "${type}"`,
      fields: "source",
    });

    return data[0]?.source;
  };
}
