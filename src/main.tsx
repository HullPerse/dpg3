import { StrictMode, startTransition } from "react";
import "@/index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import QueryConfig from "@/config/query.config";
import { router } from "@/router";
import { initializeAuthStore } from "@/store/login.store";
import { ThemeProvider } from "./components/providers/theme.provider";

const queryClient = new QueryClient(QueryConfig);

await import("react-dom/client").then(({ createRoot }) => {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Root element not found");

  initializeAuthStore();

  startTransition(() => {
    createRoot(rootElement).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <RouterProvider router={router} />
          </ThemeProvider>
        </QueryClientProvider>
      </StrictMode>,
    );
  });
});
