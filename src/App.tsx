import { useRouterState } from "@tanstack/react-router";
import {
  lazy,
  Suspense,
  startTransition,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ToastContainer } from "react-toastify";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import Modal from "@/pages/modal.page";
import { Particles } from "./components/shared/particles.component";
import { BigLoader } from "./components/ui/loader.components";
import Header from "./pages/header/header.page";
import Sidebar from "./pages/sidebar/sidebar.page";
import { useThemeStore } from "./store/theme.store";

const MainMap = lazy(() => import("@/pages/map/map.page"));

function App() {
  const { colors, particles } = useThemeStore((state) => state);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setShowParticles(true);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const transformWrapperProps = useMemo(
    () => ({
      centerOnInit: true,
      initialScale: 0.5,
      minScale: 0.5,
      maxScale: 5,
      panning: {
        allowLeftClickPan: false,
      },
      doubleClick: {
        disabled: true,
      },
      zoomAnimation: {
        animationTime: 0.5,
        animationType: "easeInOutCubic" as const,
      },
      limitToBounds: false,
    }),
    [],
  );

  const transformComponentStyles = useMemo(
    () => ({
      wrapperStyle: { width: "100%", height: "100%" },
      contentStyle: { width: "100%", height: "100%" },
    }),
    [],
  );

  return (
    <main
      className="flex flex-row h-screen w-screen bg-background scroll-smooth"
      onContextMenu={(e) => e.preventDefault()}
    >
      <ToastContainer />
      <Modal path={pathname} />

      <TransformWrapper {...transformWrapperProps}>
        <Sidebar />
        <section className="flex flex-col w-full h-full">
          <Header />
          <div className="relative flex-1">
            <TransformComponent {...transformComponentStyles}>
              <Suspense fallback={<BigLoader />}>
                <MainMap />
              </Suspense>
            </TransformComponent>

            {particles.enabled && showParticles && (
              <Suspense fallback={null}>
                <Particles
                  className="absolute inset-0 pointer-events-none"
                  quantity={250}
                  ease={80}
                  color={colors.muted}
                  refresh
                />
              </Suspense>
            )}
          </div>
        </section>
      </TransformWrapper>
    </main>
  );
}

export default App;
