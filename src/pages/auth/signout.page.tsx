import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { Button } from "@/components/ui/button.component";
import { SmallLoader } from "@/components/ui/loader.components";
import Toast from "@/components/ui/toast.component";
import { useLoginStore } from "@/store/login.store";

export default function Signout() {
  const logout = useLoginStore((state) => state.logout);
  const { isLoading } = useLoginStore((state) => state);
  const navigate = useNavigate();

  const handleSignout = useCallback(async () => {
    try {
      await logout();
      Toast("ВЫ УСПЕШНО ВЫШЛИ ИЗ АККАУНТА", "success");
      navigate({ to: "/" });
    } catch (error) {
      console.error("Signout error:", error);
      Toast("ОШИБКА ПРИ ВЫХОДЕ", "error");
    }
  }, [logout, navigate]);

  return (
    <main className="flex flex-col gap-4 text-center">
      <span className="text-primary font-mono">
        Вы уверены, что хотите выйти?
      </span>
      <div className="flex gap-2 justify-center">
        <Button onClick={handleSignout} disabled={isLoading} className="flex-1">
          {isLoading ? <SmallLoader /> : "ВЫЙТИ"}
        </Button>
      </div>
    </main>
  );
}
