import { memo } from "react";
import { Button } from "@/components/ui/button.component";
import type { UserListItemProps } from "@/types/users";

const UserListItem = memo(
  function UserListItem({
    item,
    sidebarOpen,
    onNavigate,
    onContextMenu,
  }: UserListItemProps) {
    return (
      <Button
        className={`relative flex flex-row h-12 rounded border border-primary items-center ${
          sidebarOpen ? "justify-start w-full" : "justify-center w-12"
        } px-2 gap-2`}
        onClick={() => onNavigate(item.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(item.id);
        }}
      >
        <span>{item.avatar}</span>
        {sidebarOpen && <div className="p-2 font-bold">{item.username}</div>}
        {sidebarOpen && (
          <span className="absolute bottom-1 right-1 text-xs text-muted">
            {item.data.money.current} чубриков
          </span>
        )}
      </Button>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.avatar === nextProps.item.avatar &&
      prevProps.item.username === nextProps.item.username &&
      prevProps.sidebarOpen === nextProps.sidebarOpen &&
      prevProps.onNavigate === nextProps.onNavigate &&
      prevProps.onContextMenu === nextProps.onContextMenu
    );
  },
);

export default UserListItem;
