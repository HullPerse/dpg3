import type { RecordSubscription } from "pocketbase";
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { client } from "@/api/client.api";
import type { LoginStore } from "@/types/store";
import type { User } from "@/types/users";

const usersCollection = client.collection("users");

const handleUserUpdate = (
  data: RecordSubscription<User>,
  set: (state: Partial<LoginStore>) => void,
  get: () => LoginStore,
) => {
  if (data.action === "update" && data.record) {
    set({ user: data.record });
  } else if (data.action === "delete") {
    get().clear();
  }
};

export const useLoginStore = create<LoginStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        isAuth: false,
        user: null,
        isLoading: true,
        sidebarOpen: false,

        subscribeToUserUpdates: () => {
          const { user } = get();
          if (!user?.id) return;

          usersCollection.subscribe(
            user.id,
            (data: RecordSubscription<User>) => {
              handleUserUpdate(data, set, get);
            },
          );
        },

        unsubscribeFromUserUpdates: () => {
          const { user } = get();
          if (user?.id) {
            usersCollection.unsubscribe(user.id);
          }
        },

        login: async (email: string, password: string) => {
          set({ isLoading: true });
          const authData = await usersCollection.authWithPassword<User>(
            email,
            password,
          );

          set({
            isAuth: true,
            user: authData.record,
            isLoading: false,
          });

          get().subscribeToUserUpdates();
        },

        logout: async () => {
          client.authStore.clear();
          get().unsubscribeFromUserUpdates();
          get().clear();
        },

        refresh: async () => {
          set({ isLoading: true });

          usersCollection.authRefresh();

          const isValid = client.authStore.isValid;
          const user = client.authStore.record as User | null;

          set({
            isAuth: isValid,
            user,
            isLoading: false,
          });

          if (isValid && user) {
            get().subscribeToUserUpdates();
          }
        },

        clear: () => {
          set({
            isAuth: false,
            user: null,
            isLoading: false,
          });
        },

        setSidebarOpen: (open: boolean) => {
          set({ sidebarOpen: open });
        },
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({
          token: client.authStore.token,
          sidebarOpen: state.sidebarOpen,
        }),
        onRehydrateStorage: () => {
          return (_, error) => {
            if (error) {
              console.error("Error rehydrating auth store:", error);
              return;
            }

            // Don't access store here - will be handled by initializeAuthStore
          };
        },
      },
    ),
  ),
);

export const initializeAuthStore = async () => {
  // Wait for store to be fully initialized
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Initial sync with PocketBase auth state
  const isAuth = client.authStore.isValid;
  const user = client.authStore.record as User | null;

  useLoginStore.setState({
    isAuth,
    user,
    isLoading: false,
  });

  // Set up listener for auth changes
  client.authStore.onChange(() => {
    const isAuth = client.authStore.isValid;
    const user = client.authStore.record as User | null;

    useLoginStore.setState({
      isAuth,
      user,
      isLoading: false,
    });

    if (isAuth && user) {
      useLoginStore.getState().subscribeToUserUpdates();
    } else {
      useLoginStore.getState().unsubscribeFromUserUpdates();
    }
  });

  // If user appears to be authenticated, refresh to validate
  if (isAuth && user) {
    try {
      await useLoginStore.getState().refresh();
    } catch (error) {
      console.error("Auth refresh failed:", error);
      useLoginStore.getState().clear();
    }
  } else {
    // Set loading to false if no valid auth
    useLoginStore.setState({ isLoading: false });
  }
};
