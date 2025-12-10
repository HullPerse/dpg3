import { useDraggable } from "@dnd-kit/react";
import { useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import Tooltip from "@/components/ui/tooltip.component";
import { useLoginStore } from "@/store/login.store";
import type { User } from "@/types/users";

function UserComponent({
  user,
  onHoverChange,
}: Readonly<{
  user: User;
  onHoverChange?: (hovering: boolean) => void;
}>) {
  const auth = useLoginStore((state) => state.user);
  const navigate = useNavigate();

  const isOwner = auth?.id === user.id;
  const isJailed = auth?.jailStatus === true;
  const isDraggable = isOwner && !isJailed;

  const { ref, isDragging } = useDraggable({
    id: user.id,
    disabled: !isDraggable,
    data: { user },
  });

  const navigateToProfile = useCallback(
    (id: string) => {
      if (!id) return;
      navigate({ to: "/profile/$id", params: { id } });
    },
    [navigate],
  );

  const handlePointerEnter = useCallback(() => {
    onHoverChange?.(true);
  }, [onHoverChange]);

  const handlePointerLeave = useCallback(() => {
    onHoverChange?.(false);
  }, [onHoverChange]);

  const handleDoubleClick = useCallback(() => {
    navigateToProfile(user.id);
  }, [navigateToProfile, user.id]);

  const tooltipContent = useMemo(() => {
    return (
      <span className="flex flex-col bg-primary rounded px-2 text-sm font-bold text-background">
        <span>{user.username}</span>
        {user.isPooped && (
          <span className="text-[7px]  text-yellow-800">В ГОВНЕ</span>
        )}
      </span>
    );
  }, [user.username, user.isPooped]);

  return (
    <main
      ref={ref}
      className="relative rounded-full w-6 h-6 border-2 flex items-center justify-center text-xs font-bold z-50 bg-background transition-all select-none"
      style={{
        borderColor: user.isPooped ? "#432004" : user.color,
        cursor: isDraggable ? "grab" : "default",
        touchAction: "none",
      }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onDoubleClick={handleDoubleClick}
      id={`user-${user.id}`}
    >
      <Tooltip position="top" hoverOpen={true} content={tooltipContent}>
        <div
          className="absolute inset-0 rounded-full flex items-center justify-center transition-colors "
          style={{
            backgroundColor: isDragging
              ? user.isPooped
                ? "#432004"
                : user.color
              : "var(--background)",
          }}
        >
          <span className="text-white font-bold text-xs select-none">
            {user.isPooped ? "💩" : user.avatar}
          </span>
        </div>

        {isOwner && isJailed && (
          <Lock className="absolute text-primary bg-background border border-primary rounded-full w-4 h-4 p-0.5" />
        )}
      </Tooltip>

      {isDragging && isDraggable && (
        <div className="absolute inset-0 rounded-full ring-4 ring-white/30 animate-pulse" />
      )}
    </main>
  );
}

export default memo(UserComponent);
