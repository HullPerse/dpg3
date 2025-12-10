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

      await client.collection("users").create(userData);
    } catch (error) {
      console.error("Ошибка при создании пользователя:", error);
      throw error;
    }
  };

  getUsers = async () => {
    return await client.collection("users").getFullList();
  };

  getExistingUsers = async () => {
    return await client.collection("users").getFullList({
      fields: "username, avatar, color, id",
    });
  };

  getUserById = async (id: string) => {
    return await client.collection("users").getOne(id);
  };

  getUsernameById = async (id: string) => {
    return await client.collection("users").getOne(id, {
      fields: "username",
    });
  };

  getMoney = async (id: string) => {
    return await client.collection("users").getOne(id, {
      fields: "data",
    });
  };

  changeMoney = async (id: string, money: number, finish?: number) => {
    const user = await client.collection("users").getOne(id, {
      fields: "data",
    });

    const currentMoney = (user.data as User["data"]).money.current;
    const totalMoney = (user.data as User["data"]).money.total;
    const currentCell = (user.data as User["data"]).cell;
    const totalFinish = (user.data as User["data"]).totalFinish;

    return await client.collection("users").update(id, {
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
      const item = await client.collection("items").getOne(itemId, {
        fields: "label, image, id, charge",
      });
      itemCharge = item.charge ?? null;
    } else {
      itemCharge = charge;
    }

    const item = await client.collection("items").getOne(itemId, {
      fields: "label, image, id",
    });

    await client.collection("inventory").create({
      userId: userId,
      itemId: itemId,
      charge: itemCharge,
    });

    const user = await client.collection("users").getOne(userId, {
      fields: "username",
    });

    const logData = {
      username: user.username.toUpperCase(),
      type: "newItem" as LogType["type"],
      image: `${itemImage}${item.id}/${item.image}`,
    };

    return await new LogsApi().createLog({
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

  removeItem = async (id: string) => {
    return await client.collection("inventory").delete(id);
  };

  changeCharges = async (inventoryId: string, charge: number) => {
    return await client.collection("inventory").update(inventoryId, {
      charge: charge,
    });
  };

  getStats = async (id: string) => {
    return await client.collection("users").getFirstListItem(`id = "${id}"`, {
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
    const itemsApi = new ItemsApi();
    const mapApi = new MapApi();
    const logsApi = new LogsApi();

    const user = await this.getUserById(userId);
    const inventory = await itemsApi.getInventory(userId);

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
        const cellPooped = await mapApi
          .getSingleCell(cell.label)
          .then((res) => res.some((cell) => cell.poop));

        if (cellPooped) continue;
        const level = getCellLevel(cell.difficulty);
        await mapApi.poopCell(userId, level, cell.label);
      }

      await this.removeItem(userSkis.id);
    }

    if (steppedOnPoop && cellName) {
      if (!userBoots) {
        await this.changePooped(userId, true);
      }

      await mapApi.removePoop(cellName);
      if (userBoots) await this.removeItem(userBoots.id);
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

    await client.collection("users").update(user.id, {
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

    await logsApi.createLog({
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
    await client.collection("users").update(id, {
      isPooped: pooped,
    });
  };

  itemAvailability = async (userId: string, itemId: string) => {
    const result = await client.collection("inventory").getFullList({
      filter: `userId = "${userId}" && itemId = "${itemId}"`,
    });

    return result.length > 0;
  };

  changeJail = async (id: string, status: boolean) => {
    return await client.collection("users").update(id, {
      jailStatus: status,
    });
  };

  changeVending = async (id: string) => {
    return await client.collection("users").update(id, {
      vendingMachine: getVending(),
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

    // WARNING: This works better in terms of performance, but since i wont exchange more than ~30 items at once, i will use cleaner version

    // await Promise.all(
    //   items.map((item) =>
    //     client.collection("inventory").create({
    //       itemId: item.itemId,
    //       userId: targetId,
    //       charge: item.charge,
    //     }),
    //   ),
    // );

    // await Promise.all(
    //   items.map((item) =>
    //     client.collection("inventory").delete(item.instanceId),
    //   ),
    // );
  };

  getJson = async (type: "map"): Promise<MapCellsType[]> => {
    const data = await client.collection("json").getFullList<JsonRecord>({
      filter: `type = "${type}"`,
      fields: "source",
    });

    return data[0]?.source;
  };
}
