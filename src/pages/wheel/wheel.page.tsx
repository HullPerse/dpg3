import { useNavigate, useSearch } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ModalLoading } from "@/components/ui/modal.state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.components";

const WheelItems = lazy(() => import("./tabs/items.tab"));
const ItemList = lazy(() => import("./tabs/list.tab"));
const WheelPreset = lazy(() => import("./tabs/preset.tab"));
const WheelAllPreset = lazy(() => import("./tabs/games.tab"));
const WheelUser = lazy(() => import("./tabs/users.tab"));
const WheelUserItem = lazy(() => import("./tabs/inventory.tab"));
const WheelUserGames = lazy(() => import("./tabs/userGames.tab"));
const WheelCustom = lazy(() => import("./tabs/custom.tab"));

export default function Wheel() {
  const search = useSearch({ strict: false });
  const navigate = useNavigate();

  const TABS = useMemo(
    () => [
      {
        value: "WheelItems",
        label: "Колесо",
        component: WheelItems,
      },
      {
        value: "ItemList" as const,
        label: "Все предметы",
        component: ItemList,
      },
      {
        value: "WheelPresets" as const,
        label: "Игры",
        component: WheelPreset,
      },
      {
        value: "PresetList" as const,
        label: "Пресеты",
        component: WheelAllPreset,
      },
      {
        value: "UserList" as const,
        label: "Пользователи",
        component: WheelUser,
      },
      {
        value: "UserGames" as const,
        label: "Игры пользователей",
        component: WheelUserGames,
      },
      {
        value: "UserItems" as const,
        label: "Предметы пользователей",
        component: WheelUserItem,
      },
      {
        value: "CustomWheel" as const,
        label: "Кастомное",
        component: WheelCustom,
      },
    ],
    [],
  );

  const [activeTab, setActiveTab] = useState(
    (search as { tab?: string })?.tab || "Колесо",
  );

  useEffect(() => {
    const tabFromUrl = (search as { tab?: string })?.tab;
    if (tabFromUrl && TABS.some((tab) => tab.label === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [search, TABS]);

  const handleChangeTab = (value: string) => {
    setActiveTab(value);
    const currentUser = (search as { user?: string })?.user;
    navigate({
      to: "/wheel",
      search: {
        tab: value,
        ...(value === "Предметы пользователей" &&
          currentUser && { user: currentUser }),
      },
    });
  };

  return (
    <main className="h-full w-full p-4 md:p-6">
      <Tabs
        value={activeTab}
        onValueChange={handleChangeTab}
        defaultValue="Колесо"
        className="w-full h-full flex flex-col"
      >
        <TabsList className="h-auto w-full flex max-lg:flex-col gap-2 rounded-lg bg-background/50 backdrop-blur-sm p-1.5 border border-border/50 shadow-sm">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.label}
              className="rounded w-full transition-all duration-200 hover:bg-primary/10 data-[state=active]:bg-primary/10 data-[state=active]:shadow-md cursor-pointer"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 mt-4 min-h-0 relative flex items-center w-full justify-center">
          <AnimatePresence mode="wait">
            {TABS.map(
              (tab) =>
                activeTab === tab.label && (
                  <motion.div
                    key={tab.value}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-y-auto overflow-x-hidden h-full absolute inset-0 flex  justify-center"
                  >
                    <Suspense fallback={<ModalLoading />}>
                      <tab.component />
                    </Suspense>
                  </motion.div>
                ),
            )}
          </AnimatePresence>
        </div>
      </Tabs>
    </main>
  );
}
