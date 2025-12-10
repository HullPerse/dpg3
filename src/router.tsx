import {
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import App from "./App";
import OutletComponent from "./components/shared/outlet.component";

const rootRoute = createRootRoute({
  component: OutletComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});

const menuRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/menu",
  component: App,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: App,
});

const profileIdRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/$id",
  component: App,
});

const logsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/logs",
  component: App,
});

const signinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signin",
  component: App,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: App,
});

const signoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signout",
  component: App,
});

const errorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/error",
  component: App,
});

const rulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rules",
  component: App,
});

const wheelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wheel",
  component: App,
});

const statsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/stats",
  component: App,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  menuRoute,
  profileRoute,
  profileIdRoute,
  logsRoute,
  signinRoute,
  signupRoute,
  signoutRoute,
  errorRoute,
  rulesRoute,
  wheelRoute,
  statsRoute,
]);

const NotFoundRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/error", replace: true });
  }, [navigate]);

  return null;
};

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundRedirect,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
