import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import type { RecordModel } from "pocketbase";
import { startTransition, useCallback } from "react";
import LogsApi from "@/api/logs.api";
import UsersApi from "@/api/users.api";
import LogCard from "@/components/shared/log.component";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import { useSubscription } from "@/hooks/useSubscription";
import { timeAgo } from "@/lib/utils";
import { useLoginStore } from "@/store/login.store";
import type { LogType } from "@/types/log";

export default function UserLogs() {
  const params = useParams({ strict: false });
  const queryClient = useQueryClient();
  const user = useLoginStore((state) => state.user);

  const targetUserId = params.id || user?.id;

  const { data, isLoading, isError } = useQuery<LogType[]>({
    queryKey: ["userLogs", targetUserId],
    queryFn: async () => {
      if (!targetUserId || !user) return [];

      const userRecord = await new UsersApi().getUsernameById(targetUserId);
      const username = userRecord.username as string;

      const allLogs = (await new LogsApi().getLogsByUser(username)).filter(
        (log: RecordModel) =>
          log.username === username || log.text?.includes(username),
      );
      return allLogs.reverse().map(
        (log: RecordModel): LogType => ({
          username: log.username as string,
          type: log.type as LogType["type"],
          text: log.text as string | undefined,
          image: log.image as string | undefined,
          updated: timeAgo(new Date(log.updated as string)) || undefined,
          id: log.id as string,
        }),
      );
    },
    enabled: !!targetUserId && !!user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const invalidateQuery = useCallback(() => {
    if (targetUserId) {
      startTransition(() => {
        queryClient.invalidateQueries({
          queryKey: ["userLogs", targetUserId],
          refetchType: "all",
        });
      });
    }
  }, [queryClient, targetUserId]);

  useSubscription("logs", `*`, invalidateQuery);

  if (isError) return <ModalError />;
  if (isLoading) return <ModalLoading />;

  return (
    <main className="flex flex-col w-full h-full overflow-y-auto gap-2">
      {data?.map((log: LogType) => {
        return <LogCard key={log.id} log={log} />;
      })}
    </main>
  );
}
