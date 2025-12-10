import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, X } from "lucide-react";
import {
  lazy,
  memo,
  Suspense,
  startTransition,
  useCallback,
  useMemo,
} from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/modal.component";
import { ModalLoading } from "@/components/ui/modal.state";
import { modalRegistry } from "@/config/modal.config";
import { useLoginStore } from "@/store/login.store";

const Menu = lazy(() => import("@/pages/menu.page"));
const Profile = lazy(() => import("@/pages/profile/profile.page"));
const Logs = lazy(() => import("@/pages/logs/logs.page"));
const Login = lazy(() => import("@/pages/auth/signin.page"));
const Signup = lazy(() => import("@/pages/auth/signup.page"));
const Signout = lazy(() => import("@/pages/auth/signout.page"));
const Rules = lazy(() => import("@/pages/rules/rules.page"));
const Wheel = lazy(() => import("@/pages/wheel/wheel.page"));
const Stats = lazy(() => import("@/pages/stats/stats.page"));
const NotFound = lazy(() => import("@/pages/error.page"));

// Register all modal routes
modalRegistry.register({
  path: "/menu",
  component: Menu,
  config: {
    title: "МЕНЮ",
    description: "Выберите пункт меню",
    size: {
      width: "520px",
      maxWidth: "90%",
      height: "350px",
      maxHeight: "90%",
    },
    showBackButton: false,
  },
});

modalRegistry.register({
  path: "/profile",
  component: Profile,
  config: {
    title: "ПРОФИЛЬ",
    description: "Информация о пользователе",
    size: {
      width: "90%",
      maxWidth: "90%",
      height: "90%",
      maxHeight: "90%",
    },
    showBackButton: true,
  },
});

// Register pattern for dynamic profile routes
modalRegistry.registerPattern(/^\/profile\/([^\/]+)$/, (match) => ({
  path: match[0],
  component: Profile,
  config: {
    title: "ПРОФИЛЬ",
    description: "Информация о пользователе",
    size: {
      width: "90%",
      maxWidth: "90%",
      height: "90%",
      maxHeight: "90%",
    },
    showBackButton: true,
  },
}));

modalRegistry.register({
  path: "/logs",
  component: Logs,
  config: {
    title: "ЛОГИ",
    description: "",
    size: {
      width: "620px",
      maxWidth: "90%",
      height: "790px",
      maxHeight: "90%",
    },
    showBackButton: false,
  },
});

modalRegistry.register({
  path: "/signin",
  component: Login,
  config: {
    title: "ВОЙТИ",
    description: "Введите данные для входа",
    size: {
      width: "520px",
      maxWidth: "90%",
      height: "320px",
      maxHeight: "90%",
    },
    showBackButton: true,
  },
});

modalRegistry.register({
  path: "/signup",
  component: Signup,
  config: {
    title: "РЕГИСТРАЦИЯ",
    description: "Создайте новый аккаунт",
    size: {
      width: "520px",
      maxWidth: "90%",
      height: "630px",
      maxHeight: "90%",
    },
    showBackButton: true,
  },
});

modalRegistry.register({
  path: "/signout",
  component: Signout,
  config: {
    title: "ВЫХОД",
    description: "Подтвердите выход из аккаунта",
    size: {
      width: "520px",
      maxWidth: "90%",
      height: "190px",
      maxHeight: "90%",
    },
    showBackButton: true,
  },
});

modalRegistry.register({
  path: "/rules",
  component: Rules,
  config: {
    title: "ПРАВИЛА",
    description: "Правила игры",
    size: {
      width: "600px",
      maxWidth: "90%",
      height: "700px",
      maxHeight: "90%",
    },
    showBackButton: true,
  },
});

modalRegistry.register({
  path: "/wheel",
  component: Wheel,
  config: {
    title: "КОЛЕСО",
    description: "Случайный выбор предметов",
    size: {
      width: "90%",
      maxWidth: "90%",
      height: "90%",
      maxHeight: "90%",
    },
    showBackButton: true,
  },
});

modalRegistry.register({
  path: "/stats",
  component: Stats,
  config: {
    title: "СТАТИСТИКА",
    description: "Статистика игр и пользователей",
    size: {
      width: "70%",
      maxWidth: "90%",
      height: "70%",
      maxHeight: "90%",
    },
    showBackButton: true,
  },
});

modalRegistry.register({
  path: "/error",
  component: NotFound,
  config: {
    title: "ОШИБКА 404",
    description: "Страница не найдена",
    size: {
      width: "500px",
      maxWidth: "90%",
      height: "400px",
      maxHeight: "90%",
    },
    showBackButton: false,
  },
});

modalRegistry.register({
  path: "/error",
  component: NotFound,
  config: {
    title: "ОШИБКА 404",
    description: "Страница не найдена",
    size: {
      width: "500px",
      maxWidth: "90%",
      height: "400px",
      maxHeight: "90%",
    },
    showBackButton: false,
  },
});

const LazyComponentRenderer = memo(
  ({ Component }: { Component: React.ComponentType }) => (
    <Suspense fallback={<ModalLoading />}>
      <Component />
    </Suspense>
  ),
);
LazyComponentRenderer.displayName = "LazyComponentRenderer";

const useModalConfig = (path: string) => {
  const isAuth = useLoginStore((state) => state.isAuth);

  return useMemo(() => {
    const route = modalRegistry.find(path);
    if (!route) return null;

    const { component, config } = route;

    // Apply dynamic adjustments based on auth state
    const adjustedConfig = { ...config };
    if (path === "/menu" && !isAuth) {
      adjustedConfig.size = {
        ...config.size,
        height: "200px",
      };
    }

    return {
      ...adjustedConfig,
      component,
    };
  }, [path, isAuth]);
};

// Hook to check if modal should open
const useShouldOpen = (path: string): boolean => {
  return useMemo(() => {
    if (path === "/" || path === "") return false;

    const route = modalRegistry.find(path);
    return route !== null;
  }, [path]);
};

// Main Modal component
function Modal({ path }: Readonly<{ path: string }>) {
  const navigate = useNavigate();
  const shouldOpen = useShouldOpen(path);
  const modalConfig = useModalConfig(path);

  const dialogContentStyle = useMemo(
    () => ({
      width: modalConfig?.size.width,
      maxWidth: modalConfig?.size.maxWidth,
      height: modalConfig?.size.height,
      maxHeight: modalConfig?.size.maxHeight,
      transition: "width 0.3s ease-in-out, height 0.3s ease-in-out",
    }),
    [modalConfig],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        startTransition(() => {
          navigate({ to: "/" });
        });
      }
    },
    [navigate],
  );

  if (!shouldOpen || !modalConfig) {
    return null;
  }

  return (
    <Dialog open={shouldOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex flex-col text-center justify-center p-4 bg-background border-2 border-primary rounded text-primary overflow-x-hidden"
        style={dialogContentStyle}
        showCloseButton={false}
      >
        <DialogHeader className="relative flex flex-col items-center">
          {modalConfig.showBackButton && (
            <Link
              to="/menu"
              className="absolute top-2 left-2 text-primary cursor-pointer"
              preload="intent"
            >
              <ChevronLeft className="h-4 w-4 pointer-events-none" />
            </Link>
          )}
          <DialogClose className="absolute top-2 right-2 text-primary cursor-pointer">
            <X className="h-4 w-4 pointer-events-none" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogTitle>{`> ${modalConfig.title} <`}</DialogTitle>
          <DialogDescription className="text-center text-primary font-mono text-xs">
            {modalConfig.description}
          </DialogDescription>
        </DialogHeader>
        <section className="w-full h-full rounded overflow-y-auto">
          <LazyComponentRenderer Component={modalConfig.component} />
        </section>
      </DialogContent>
    </Dialog>
  );
}

export default memo(Modal);
