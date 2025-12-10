import { useNavigate, useRouter } from "@tanstack/react-router";
import { Box, ChevronLeft, ChevronRight, ClipboardClock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button.component";
import { useLoginStore } from "@/store/login.store";
import UserList from "./components/userlist.component";

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useLoginStore((state) => state);

  const navigate = useNavigate();
  const router = useRouter();

  const width = {
    expanded: 320,
    collapsed: 64,
  };

  const sidebarComponents = {
    log: {
      path: "/logs",
      label: "ЛОГ",
      icon: <ClipboardClock />,
    },
  };

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? width.expanded : width.collapsed }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="flex flex-col p-2 border-r border-primary bg-background"
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className={`flex items-center relative ${
          sidebarOpen ? "justify-between" : "justify-center"
        } mb-4`}
      >
        <AnimatePresence>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="text-primary flex items-center gap-2 text-xl font-bold"
            >
              <Box />
              DPG 3
            </motion.span>
          )}
        </AnimatePresence>

        <motion.div
          layout
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        >
          <Button
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded text-primary w-10 h-10"
          >
            {sidebarOpen ? (
              <ChevronLeft size={24} />
            ) : (
              <ChevronRight size={24} />
            )}
          </Button>
        </motion.div>
      </motion.div>
      <div className="flex flex-col gap-2 w-full">
        {Object.entries(sidebarComponents).map(([key, item]) => (
          <Button
            key={key}
            className={`text-primary flex items-center overflow-hidden transition-all ${
              sidebarOpen
                ? "w-full justify-start px-3"
                : "w-10 justify-center px-0 ml-0.5"
            }`}
            onMouseEnter={() => {
              router.preloadRoute({ to: item.path });
            }}
            onClick={() => {
              navigate({ to: item.path });
            }}
          >
            <div className="flex items-center justify-center shrink-0">
              {item.icon}
            </div>

            <AnimatePresence>
              {sidebarOpen && (
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}
            </AnimatePresence>
          </Button>
        ))}
      </div>

      <section className="flex flex-col w-full text-primary mt-4 border-t boder-primary">
        <UserList />
      </section>
    </motion.aside>
  );
}
