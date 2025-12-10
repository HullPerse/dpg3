import { useDragOperation } from "@dnd-kit/react";
import { Lock } from "lucide-react";
import { memo } from "react";
import { useLoginStore } from "@/store/login.store";
import type { MapDataType } from "@/types/map";

function Overlay({ data }: Readonly<{ data: MapDataType }>) {
  const { source } = useDragOperation();
  const user = useLoginStore((state) => state.user);

  if (!source) return null;

  const activeUser = data.user.find((user) => user.id === String(source.id));

  if (!activeUser) return null;

  return (
    <div
      className="relative rounded-full min-w-6 min-h-6 w-6 h-6 border-2 flex justify-center items-center text-xs font-bold z-50 bg-background shadow-lg"
      style={{
        borderColor: activeUser.color,
        cursor: "grabbing",
      }}
    >
      <div
        className="absolute inset-0 rounded-full flex items-center justify-center z-50"
        style={{
          backgroundColor: activeUser.color,
        }}
      >
        <span className="text-white font-bold text-xs select-none drop-shadow-md">
          {activeUser.avatar}
        </span>
      </div>
      {user?.id === activeUser?.id && user?.jailStatus && (
        <Lock className="absolute -bottom-1 -right-1 text-primary border border-primary bg-background rounded-full text-xs w-4 h-4 p-1 shadow-md" />
      )}
    </div>
  );
}

export default memo(Overlay);
