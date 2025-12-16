import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Check, ChevronsUpDown, Send } from "lucide-react";
import type { RecordModel } from "pocketbase";
import { useState } from "react";
import { client, itemImage } from "@/api/client.api";
import LogsApi from "@/api/logs.api";
import UsersApi from "@/api/users.api";
import { Image } from "@/components/shared/image.component";
import { Button } from "@/components/ui/button.component";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command.component";
import { SmallLoader } from "@/components/ui/loader.components";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/modal.component";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.component";
import Toast from "@/components/ui/toast.component";
import { cn, typeColor } from "@/lib/utils";
import { useLoginStore } from "@/store/login.store";
import type { ItemType } from "@/types/items";
import type { LogType } from "@/types/log";
import ItemsApi from "@/api/items.api";

const usersApi = new UsersApi();
const itemsApi = new ItemsApi();

export default function ItemDialog({
  open,
  setOpen,
  item,
  inInventory,
  inventoryId,
  inventoryCharge,
  initialCharge,
  onItemAdded,
  vending = false,
}: Readonly<{
  open: boolean;
  setOpen: (open: boolean) => void;
  item: ItemType | RecordModel;
  inInventory?: boolean;
  inventoryId?: string;
  inventoryCharge?: number;
  initialCharge?: number;
  onItemAdded?: () => void;
  vending?: boolean;
}>) {
  const [loading, setLoading] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const params = useParams({ strict: false });

  const user = useLoginStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["allUsernames"],
    queryFn: async () => {
      const existingUsers = await usersApi.getExistingUsers();
      const users = existingUsers.filter((item) => item.id !== user?.id);
      return users || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  if (!item) return null;

  const handleAddItem = async ({ userId }: { userId?: string }) => {
    setLoading(true);

    if (!user || !item) {
      setLoading(false);
      return Toast("ВЫ НЕ АВТОРИЗОВАНЫ", "error");
    }

    try {
      const targetUserId = userId || user.id;
      await usersApi.addItem(targetUserId, item.id as string);
      queryClient.invalidateQueries({
        queryKey: ["userInventoryData", targetUserId],
      });
      queryClient.invalidateQueries({
        queryKey: ["userInventory", targetUserId],
      });
      Toast("ПРЕДМЕТ УСПЕШНО ДОБАВЛЕН", "success");
      setLoading(false);
      setOpen(false);
      onItemAdded?.();
    } catch (error) {
      console.error("Ошибка при добавлении предмета", error);
      Toast("ОШИБКА ПРИ ДОБАВЛЕНИИ ПРЕДМЕТА", "error");
      setLoading(false);
      return;
    }
  };

  const handleRemoveItem = async () => {
    setLoading(true);

    if (!user || !item) {
      setLoading(false);
      return Toast("Вы не авторизованы", "error");
    }

    try {
      await itemsApi.addTrash(String(item.id));
      await usersApi.removeItem(inventoryId as string);
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: ["userInventoryData", user.id],
        });
        queryClient.invalidateQueries({ queryKey: ["userInventory", user.id] });
      }
      Toast("ПРЕДМЕТ УСПЕШНО УДАЛЕН", "success");
      setLoading(false);
      setOpen(false);
    } catch (error) {
      console.error("Ошибка при удалении предмета", error);
      Toast("ОШИБКА ПРИ УДАЛЕННИ ПРЕДМЕТА", "error");
      setLoading(false);
      return;
    }
  };

  const handleSendItemDirectly = async (targetUserId: string) => {
    setLoading(true);

    if (!user || !item) {
      setLoading(false);
      return Toast("Вы не авторизованы", "error");
    }

    try {
      const itemCharge = item.charge ?? null;

      await client.collection("inventory").create({
        userId: targetUserId,
        itemId: item.id as string,
        charge: itemCharge,
      });

      queryClient.invalidateQueries({
        queryKey: ["userInventoryData", targetUserId],
      });
      queryClient.invalidateQueries({
        queryKey: ["userInventory", targetUserId],
      });

      const targetUsername = await usersApi.getUsernameById(targetUserId);
      const senderUsername = user.username.toUpperCase();

      const logData = {
        username: senderUsername,
        type: "sendItem" as LogType["type"],
        image: `${itemImage}${item.id}/${item.image}`,
      };

      await new LogsApi().createLog({
        type: logData.type,
        sender: {
          id: user.id,
          username: senderUsername,
        },
        receiver: {
          id: targetUserId,
          username: targetUsername.username,
        },
        label: item.label,
        image: logData.image,
      });
      Toast("ПРЕДМЕТ УСПЕШНО ОТПРАВЛЕН", "success");
      setLoading(false);
      setComboboxOpen(false);
      setSelectedUserId("");
      setOpen(false);
      onItemAdded?.();
    } catch (error) {
      console.error("Ошибка при отправке предмета", error);
      Toast("ОШИБКА ПРИ ОТПРАВКЕ ПРЕДМЕТА", "error");
      setLoading(false);
      return;
    }
  };

  const handleTransferItem = async (targetUserId: string) => {
    setLoading(true);

    if (!user || !item || !inventoryId) {
      setLoading(false);
      return Toast("Вы не авторизованы", "error");
    }

    try {
      const inventoryEntry = await client
        .collection("inventory")
        .getOne(inventoryId);
      const currentCharge =
        typeof inventoryEntry.charge === "number"
          ? inventoryEntry.charge
          : null;

      await usersApi.addItem(targetUserId, item.id as string, currentCharge);
      await usersApi.removeItem(inventoryId);

      queryClient.invalidateQueries({
        queryKey: ["userInventoryData", user.id],
      });
      queryClient.invalidateQueries({ queryKey: ["userInventory", user.id] });
      queryClient.invalidateQueries({
        queryKey: ["userInventoryData", targetUserId],
      });
      queryClient.invalidateQueries({
        queryKey: ["userInventory", targetUserId],
      });

      const targetUsername = await usersApi.getUsernameById(targetUserId);
      const senderUsername = await usersApi.getUsernameById(String(params.id));

      const logData = {
        username: user.username.toUpperCase(),
        type: "sendItem" as LogType["type"],
        image: `${itemImage}${item.id}/${item.image}`,
      };

      await new LogsApi().createLog({
        type: logData.type,
        sender: {
          id: user.id,
          username:
            senderUsername.username.toUpperCase() ??
            user.username.toUpperCase(),
        },
        receiver: {
          id: targetUserId,
          username: targetUsername.username,
        },
        label: item.label,
        image: logData.image,
      });
      Toast("ПРЕДМЕТ УСПЕШНО ПЕРЕДАН", "success");
      setLoading(false);
      setComboboxOpen(false);
      setSelectedUserId("");
      setOpen(false);
    } catch (error) {
      console.error("Ошибка при передаче предмета", error);
      Toast("ОШИБКА ПРИ ПЕРЕДАЧЕ ПРЕДМЕТА", "error");
      setLoading(false);
      return;
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setComboboxOpen(false);
  };

  const selectedUser = users?.find((u: RecordModel) => u.id === selectedUserId);

  const displayCharge = inInventory
    ? (inventoryCharge ?? initialCharge ?? item.charge ?? 0)
    : (item.charge ?? 0);

  return (
    <section className="flex w-full items-center justify-center ">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="min-h-[250px] h-fit flex flex-col text-center items-center justify-center p-6 bg-background border-2 border-primary rounded text-primary">
          <DialogHeader className="text-center">
            <DialogTitle className="text-center">{`> ПРЕДМЕТ <`}</DialogTitle>
            <DialogDescription className="text-center text-primary font-mono text-xs">
              Взаимодействие с предметом
            </DialogDescription>
          </DialogHeader>
          <section className="relative flex flex-col w-full h-full rounded overflow-y-auto gap-2 items-center ">
            {item.image && (
              <div className="flex flex-col rounded border border-primary min-w-24 min-h-24 w-24 h-24 gap-2 overflow-hidden">
                <Image
                  src={`${itemImage}${item.id}/${item.image}`}
                  alt={item.label}
                  className="w-full h-full object-contain p-2 select-none"
                  loading="lazy"
                />
              </div>
            )}

            {item.type && (
              <span
                className={cn(
                  "shrink-0 text-xs",
                  typeColor(item.type).baseClass,
                  typeColor(item.type).toneClass,
                )}
              >
                {item.type}
              </span>
            )}

            {item.usage && (
              <span
                className={cn(
                  "shrink-0 text-xs",
                  typeColor(item.type).baseClass,
                )}
              >
                Сразу
              </span>
            )}

            {item.auto && (
              <span
                className={cn("shrink-0 text-xs", typeColor("авто").baseClass)}
              >
                Авто
              </span>
            )}

            {displayCharge > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium border backdrop-blur-[2px] bg-blue-500/10 text-blue-400 border-blue-500/25">
                Заряд: {displayCharge}
              </span>
            )}
            <div className="flex flex-col gap-2 p-2 font-bold text-center">
              <span>{item.label}</span>
              {item.description && (
                <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap wrap-break-word text-start font-medium">
                  {item.description}
                </p>
              )}
            </div>

            {inInventory ? (
              <section className="flex flex-col gap-1 w-full">
                <div className="flex flex-row gap-1 w-full">
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="default"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        className="flex-1 justify-between my-1 active:scale-100"
                        disabled={loading || isLoadingUsers}
                      >
                        {selectedUser
                          ? `${selectedUser.avatar} ${selectedUser.username}`
                          : "Выберите пользователя..."}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Поиск пользователя..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>Пользователь не найден.</CommandEmpty>
                          <CommandGroup>
                            {users?.map((u: RecordModel) => (
                              <CommandItem
                                key={u.collectionId + u.id}
                                value={`${u.username} ${u.id}`}
                                onSelect={() => handleSelectUser(u.id)}
                                className="cursor-pointer"
                              >
                                <span className="mr-2">{u.avatar}</span>
                                {u.username}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    selectedUserId === u.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button
                    disabled={loading || !selectedUserId}
                    onClick={() => handleTransferItem(selectedUserId)}
                    className="my-1"
                    size="icon"
                  >
                    {loading ? <SmallLoader /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>
                <Button
                  className="w-full my-1"
                  disabled={loading}
                  onClick={handleRemoveItem}
                >
                  {loading ? <SmallLoader /> : "Удалить из инвентаря"}
                </Button>
              </section>
            ) : (
              !vending && (
                <section className="flex flex-col gap-1 w-full">
                  <div className="flex flex-row gap-1 w-full">
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="default"
                          role="combobox"
                          aria-expanded={comboboxOpen}
                          className="flex-1 justify-between my-1 active:scale-100"
                          disabled={loading || isLoadingUsers}
                        >
                          {selectedUser
                            ? `${selectedUser.avatar} ${selectedUser.username}`
                            : "Выберите пользователя..."}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Поиск пользователя..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>Пользователь не найден.</CommandEmpty>
                            <CommandGroup>
                              {users?.map((u: RecordModel) => (
                                <CommandItem
                                  key={u.id}
                                  value={`${u.username} ${u.id}`}
                                  onSelect={() => handleSelectUser(u.id)}
                                  className="cursor-pointer"
                                >
                                  <span className="mr-2">{u.avatar}</span>
                                  {u.username}
                                  <Check
                                    className={cn(
                                      "ml-auto",
                                      selectedUserId === u.id
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <Button
                      disabled={loading || !selectedUserId}
                      onClick={() => handleSendItemDirectly(selectedUserId)}
                      className="my-1"
                      size="icon"
                    >
                      {loading ? <SmallLoader /> : <Send className="w-5 h-5" />}
                    </Button>
                  </div>
                  <Button
                    className="w-full my-1"
                    disabled={loading}
                    onClick={() => handleAddItem({})}
                  >
                    {loading ? <SmallLoader /> : "Добавить в инвентарь"}
                  </Button>
                </section>
              )
            )}
          </section>
        </DialogContent>
      </Dialog>
    </section>
  );
}
