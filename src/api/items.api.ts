import type { ItemType } from "@/types/items";
import { client } from "./client.api";

export default class ItemsApi {
  //ITEMS
  getAllItems = async () => {
    return await client.collection("items").getFullList();
  };

  getItemsByIds = async (ids: string[]) => {
    const filterId = ids.map((item) => `id='${item}'`).join("||");
    const data = await client.collection("items").getFullList({
      filter: filterId,
    });
    return data;
  };

  getSingleItemById = async (id: string) => {
    return (await client.collection("items").getOne(id)) as ItemType;
  };

  addNewItem = async (data: ItemType | FormData) => {
    return await client.collection("items").create(data);
  };

  getVendingItems = async (id: string[]) => {
    const filterId = id.map((item) => `id='${item}'`).join("||");
    const data = await client.collection("items").getFullList({
      filter: filterId,
    });
    return data;
  };

  getAllIds = async () => {
    return await client.collection("items").getFullList({
      fields: "id",
    });
  };

  //INVENTORY
  getInventory = async (userId: string) => {
    return await client.collection("inventory").getFullList({
      filter: `userId = "${userId}"`,
    });
  };

  //TRASH
  getTrash = async () => {
    const items = await client.collection("trash").getFullList();

    const itemsArray: ItemType[] = [];

    for (const item of items) {
      await this.getSingleItemById(item.itemId).then((data) => {
        itemsArray.push({ ...data, instanceId: item.id });
      });
    }

    return itemsArray;
  };

  addTrash = async (itemId: string) => {
    return await client.collection("trash").create({
      itemId: itemId,
    });
  };

  removeTrash = async (itemId: string) => {
    return await client.collection("trash").delete(itemId);
  };
}
