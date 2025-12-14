import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ModalLoading } from "@/components/ui/modal.state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.components";

const Profile = lazy(() => import("./tabs/profile.tab"));
const Inventory = lazy(() => import("./tabs/inventory.tab"));
const Games = lazy(() => import("./tabs/games.tab"));

export default function UserProfile() {
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false });
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(
    (search as { tab?: string })?.tab || "Профиль",
  );

  const TABS = useMemo(
    () => [
      {
        label: "Профиль",
        component: Profile,
      },
      {
        label: "Инвентарь",
        component: Inventory,
      },
      {
        label: "Игры",
        component: Games,
      },
    ],

    [],
  );

  useEffect(() => {
    const tabFromUrl = (search as { tab?: string })?.tab;

    if (tabFromUrl && TABS.some((tab) => tab.label === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [search, TABS]);

  const handleChangeTab = useCallback(
    (value: string) => {
      setActiveTab(value);

      if (params.id) {
        navigate({
          to: "/profile/$id",
          params: { id: params.id },
          search: { tab: value },
        });
      } else {
        navigate({
          to: "/profile",
          search: { tab: value },
        });
      }
    },
    [params.id, navigate],
  );

  return (
    <main className="h-full w-full p-4 md:p-6">
      <Tabs
        value={activeTab}
        onValueChange={handleChangeTab}
        defaultValue="Профиль"
        className="w-full h-full flex flex-col"
      >
        <TabsList className="h-auto w-full flex max-lg:flex-col gap-2 rounded-lg bg-background/50 backdrop-blur-sm p-1.5 border border-border/50 shadow-sm">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.label}
              value={tab.label}
              className="rounded w-full transition-all duration-200 hover:bg-primary/10 data-[state=active]:bg-primary/30 data-[state=active]:shadow-md cursor-pointer"
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
                    key={tab.label}
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
