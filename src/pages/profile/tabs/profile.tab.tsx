import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Check, ChevronsUpDown } from "lucide-react";
import type { RecordModel } from "pocketbase";
import {
  lazy,
  memo,
  Suspense,
  startTransition,
  useCallback,
  useEffect,
  useState,
} from "react";
import UsersApi from "@/api/users.api";
import { Button } from "@/components/ui/button.component";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command.component";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.component";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { useLoginStore } from "@/store/login.store";

const UserLogs = lazy(() => import("../components/userLogs.component"));
const UserStats = lazy(() => import("../components/userStats.component"));
const UserTrade = lazy(() => import("../components/userTrade.component"));

function Profile({ userId }: Readonly<{ userId?: string }>) {
  const params = useParams({ strict: false });
  const user = useLoginStore((state) => state.user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [open, setOpen] = useState<boolean>(false);
  const [tradeOpen, setTradeOpen] = useState<boolean>(false);
  const [value, setValue] = useState(params.id || userId || user?.id);

  const targetUserId = value || userId || user?.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["allUsernames"],
    queryFn: async () => {
      const users = await new UsersApi().getExistingUsers();

      if (!users || users.length === 0) return [];
      if (!user) return users;

      const loggedInUserIndex = users.findIndex(
        (u: RecordModel) => u.id === user.id,
      );

      if (loggedInUserIndex === -1) return users;

      const reorderedUsers = [
        users[loggedInUserIndex],
        ...users.filter(
          (_: RecordModel, index: number) => index !== loggedInUserIndex,
        ),
      ];

      return reorderedUsers;
    },
  });

  useEffect(() => {
    if (params.id && params.id !== value) {
      setValue(params.id);
    }
    if (!params.id) {
      params.id = user?.id;
    }
  }, [params.id, value, params, user]);

  const handleSelect = useCallback(
    (id: string) => {
      const newValue = id === value ? "" : id;
      startTransition(() => {
        setTradeOpen(false);
        setValue(newValue);
        setOpen(false);
      });

      if (newValue) {
        navigate({ to: `/profile/${newValue}` });
      }
    },
    [navigate, value],
  );

  const invalidateQuery = useCallback(() => {
    startTransition(() => {
      queryClient.invalidateQueries({
        queryKey: ["allUsernames", targetUserId],
        refetchType: "all",
      });
    });
  }, [targetUserId, queryClient]);

  useSubscription("users", "*", invalidateQuery);

  if (isLoading) return <ModalLoading />;
  if (isError) return <ModalError />;

  const selectedUser = data?.find((user: RecordModel) => user.id === value);

  return (
    <main className="flex flex-col w-full h-full gap-4 overflow-y-auto">
      <div className="flex flex-row max-lg:flex-col w-full h-full gap-4">
        <section className="flex flex-col h-full max-lg:h-fit w-md max-lg:w-full border border-primary rounded p-2 gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="default"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between active:scale-100"
              >
                {selectedUser
                  ? `${selectedUser.avatar} ${selectedUser.username}`
                  : "Выберите пользователя..."}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 border-0">
              <Command>
                <CommandInput
                  placeholder="Поиск пользователя..."
                  className="h-9"
                />
                <CommandList>
                  <CommandEmpty>Пользователь не найден.</CommandEmpty>
                  <CommandGroup>
                    {data?.map((item: RecordModel) => (
                      <CommandItem
                        key={item.id}
                        value={`${item.username} ${item.id}`}
                        onSelect={() => handleSelect(item.id)}
                        disabled={selectedUser && selectedUser.id === item.id}
                        className="cursor-pointer"
                      >
                        <span className="mr-2">{item.avatar}</span>
                        {item.username}
                        <Check
                          className={cn(
                            "ml-auto",
                            value === item.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <section
            className={`${tradeOpen && "max-lg:hidden"} overflow-hidden`}
          >
            <Suspense fallback={<ModalLoading />}>
              <UserStats tradeOpen={tradeOpen} setTradeOpen={setTradeOpen} />
            </Suspense>
          </section>
        </section>
        <main className="h-full w-full max-lg:w-full border border-primary rounded p-2 overflow-auto">
          <Suspense fallback={<ModalLoading />}>
            {tradeOpen ? (
              <UserTrade setTradeOpen={setTradeOpen} />
            ) : (
              <UserLogs />
            )}
          </Suspense>
        </main>
      </div>
    </main>
  );
}

export default memo(Profile);
