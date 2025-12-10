import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { startTransition, useCallback } from "react";
import { useControls } from "react-zoom-pan-pinch";
import UsersApi from "@/api/users.api";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import { useSubscription } from "@/hooks/useSubscription";
import { useLoginStore } from "@/store/login.store";
import type { User } from "@/types/users";
import UserListItem from "./userItem.component";

const usersApi = new UsersApi();

export default function UserList() {
  const sidebarOpen = useLoginStore((state) => state.sidebarOpen);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { zoomToElement } = useControls();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["userList"],
    queryFn: async () => {
      const users = await usersApi.getUsers();
      return (users || []) as unknown as User[];
    },
    retry: 2,
    retryDelay: 1000,
  });

  const invalidateUserList = useCallback(() => {
    startTransition(() => {
      queryClient.invalidateQueries({
        queryKey: ["userList"],
        refetchType: "all",
      });
    });
  }, [queryClient]);

  useSubscription("users", "*", invalidateUserList);

  const navigateToProfile = useCallback(
    (id: string) => {
      if (!id) return;
      navigate({ to: "/profile/$id", params: { id } });
    },
    [navigate],
  );

  const handleContextMenu = useCallback(
    (id: string) => {
      zoomToElement(`user-${id}`, 2);
    },
    [zoomToElement],
  );

  if (isLoading) return <ModalLoading />;
  if (isError) return <ModalError />;

  return (
    <main className="flex flex-col w-full items-center justify-center text-primary gap-2 mt-2">
      {data?.map((item) => (
        <UserListItem
          key={item.id}
          item={item}
          sidebarOpen={sidebarOpen}
          onNavigate={navigateToProfile}
          onContextMenu={handleContextMenu}
        />
      ))}
    </main>
  );
}
