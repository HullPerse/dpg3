import type { ItemType } from "@/types/items";
import { client } from "./client.api";

export default class ItemsApi {
  private readonly itemsCollection = client.collection("items");
  private readonly inventoryCollection = client.collection("inventory");
  private readonly trashCollection = client.collection("trash");

  //ITEMS
  getAllItems = async () => {
    return await this.itemsCollection.getFullList();
  };

  getItemsByIds = async (ids: string[]) => {
    if (ids.length === 0) return [];

    const filter = ids.map((id) => `id='${id}'`).join("||");
    return await this.itemsCollection.getFullList({ filter });
  };

  getSingleItemById = async (id: string) => {
    return (await this.itemsCollection.getOne(id)) as ItemType;
  };

  addNewItem = async (data: ItemType | FormData) => {
    return await this.itemsCollection.create(data);
  };

  getAllIds = async () => {
    return await this.itemsCollection.getFullList({
      fields: "id",
    });
  };

  //INVENTORY
  getInventory = async (userId: string) => {
    return await this.inventoryCollection.getFullList({
      filter: `userId = "${userId}"`,
    });
  };

  getInventoryItems = async (userId: string, itemId: string) => {
    return await this.inventoryCollection.getFullList({
      filter: `userId = "${userId}" && itemId = "${itemId}"`,
    });
  };

  removeInventoryItem = async (id: string) => {
    return await this.inventoryCollection.delete(id);
  };

  //TRASH
  getTrash = async () => {
    const items = await this.trashCollection.getFullList();

    const itemsArray: ItemType[] = [];

    for (const item of items) {
      await this.getSingleItemById(item.itemId).then((data) => {
        itemsArray.push({ ...data, instanceId: item.id });
      });
    }

    return itemsArray;
  };

  addTrash = async (itemId: string) => {
    return await this.trashCollection.create({
      itemId: itemId,
    });
  };

  removeTrash = async (itemId: string) => {
    return await this.trashCollection.delete(itemId);
  };
}
