import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { z } from "zod";
import UsersApi from "@/api/users.api";
import { Button } from "@/components/ui/button.component";
import Input from "@/components/ui/input.component";
import { SmallLoader } from "@/components/ui/loader.components";
import Toast from "@/components/ui/toast.component";
import { useLoginStore } from "@/store/login.store";

const usersApi = new UsersApi();

const signupSchema = z
  .object({
    username: z
      .string()
      .min(4, "Имя пользователя должно содержать минимум 4 символа")
      .max(20, "Имя пользователя должно содержать максимум 20 символов")
      .regex(
        /^[a-zA-Z0-9]+$/,
        "Имя пользователя может содержать только буквы и цифры",
      ),
    password: z
      .string()
      .min(8, "Пароль должен содержать минимум 8 символов")
      .max(16, "Пароль должен содержать максимум 16 символов"),
    confirmPassword: z.string(),
    color: z.string().min(1, "Выберите цвет"),
    avatar: z.string().min(1, "Выберите аватар"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

const COLORS = [
  { id: "red", value: "#FF0000" },
  { id: "green", value: "#00AA00" },
  { id: "blue", value: "#0000FF" },
  { id: "gold", value: "#FFD700" },
  { id: "purple", value: "#800080" },
  { id: "orange", value: "#FF8C00" },
  { id: "turquoise", value: "#00CED1" },
  { id: "pink", value: "#FF1493" },
  { id: "lime", value: "#32CD32" },
  { id: "orangeRed", value: "#FF4500" },
  { id: "royalBlue", value: "#4169E1" },
  { id: "brown", value: "#8B4513" },
  { id: "hotPink", value: "#FF69B4" },
  { id: "seaGreen", value: "#20B2AA" },
  { id: "mediumPurple", value: "#9370DB" },
] as const;

const AVATARS = [
  { id: "robot", label: "БИП-БОП", symbol: "🤖" },
  { id: "wizard", label: "ЧАРОДЕЙ", symbol: "🧙‍♂️" },
  { id: "knight", label: "БОЕЦ", symbol: "⚔️" },
  { id: "archer", label: "СТРЕЛОК", symbol: "🏹" },
  { id: "mage", label: "ШАРОВИК", symbol: "🔮" },
  { id: "warrior", label: "ТАНК", symbol: "🛡️" },
  { id: "dragon", label: "ДРАКОША", symbol: "🐉" },
  { id: "alien", label: "ЗЕЛЕНЫЙ", symbol: "👾" },
  { id: "detective", label: "ШЕРИФ", symbol: "🕵️" },
  { id: "skull", label: "КОСТЯК", symbol: "💀" },
  { id: "cyclone", label: "ВЕРТУШКА", symbol: "🌀" },
  { id: "pawn", label: "ПЕШКА", symbol: "♟️" },
  { id: "wolf", label: "ИЛЬЯ", symbol: "🐺" },
  { id: "ogre", label: "ТРОЛЛЬ", symbol: "🧌" },
  { id: "diamond", label: "ХУСЕКА", symbol: "💎" },
] as const;

export default function Signup() {
  const login = useLoginStore((state) => state.login);
  const navigate = useNavigate();

  const [formData, setFormData] = useState<SignupFormData>({
    username: "",
    password: "",
    confirmPassword: "",
    color: "",
    avatar: "",
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["userData"],
    queryFn: () => usersApi.getExistingUsers(),
    refetchOnMount: true,
  });

  const usedItems = useMemo(() => {
    if (!data) return { colors: new Set(), avatars: new Set() };

    const colors = new Set(data.map((user) => user.color));
    const avatars = new Set(data.map((user) => user.avatar));

    return { colors, avatars };
  }, [data]);

  const handleInputChange = useCallback(
    (field: keyof SignupFormData) => (value: string) => {
      let processedValue = value;

      if (field === "username") {
        processedValue = value.replaceAll(/[^a-zA-Z0-9]/g, "");
      }

      setFormData((prev) => ({ ...prev, [field]: processedValue }));
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      Toast(result.error.issues[0].message, "error");
      return;
    }

    try {
      await usersApi.createUser(formData);
      Toast("ПОЛЬЗОВАТЕЛЬ УСПЕШНО СОЗДАН", "success");

      await login(
        `${formData.username.toUpperCase()}@notEmail.com`,
        formData.password,
      );
      Toast("ВЫ УСПЕШНО ВОШЛИ В АККАУНТ", "success");
      navigate({ to: "/menu" });
    } catch (error) {
      console.error("Registration error:", error);
      Toast("ОШИБКА ПРИ РЕГИСТРАЦИИ", "error");
    }
  }, [formData, login, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <main
      className="flex w-full flex-col gap-2 p-2 selection:bg-primary/50 leading-tight text-start"
      onKeyDown={handleKeyDown}
    >
      <span>ИМЯ ПОЛЬЗОВАТЕЛЯ</span>
      <Input
        type="text"
        placeholder="Введите имя пользователя"
        value={formData.username}
        onChange={(e) => handleInputChange("username")(e.target.value)}
        onPaste={(e) => {
          e.preventDefault();
          const pastedText = e.clipboardData
            .getData("text")
            .replaceAll(/[^a-zA-Z0-9]/g, "");
          handleInputChange("username")(pastedText);
        }}
        disabled={isLoading}
      />

      <span>ПАРОЛЬ</span>
      <Input
        type="password"
        value={formData.password}
        onChange={(e) => handleInputChange("password")(e.target.value)}
        placeholder="Введите пароль"
        disabled={isLoading}
      />

      <span>ПОДТВЕРДИТЕ ПАРОЛЬ</span>
      <Input
        type="password"
        value={formData.confirmPassword}
        onChange={(e) => handleInputChange("confirmPassword")(e.target.value)}
        placeholder="Подтвердите пароль"
        disabled={isLoading}
      />

      <span>ЦВЕТ</span>
      <div className="flex flex-wrap gap-2 min-h-12 justify-center">
        {isLoading ? (
          <div className="flex items-center gap-2 text-primary">
            <SmallLoader />
            <span className="text-sm">Загрузка доступных цветов...</span>
          </div>
        ) : isError ? (
          <div className="text-primary text-sm">Ошибка загрузки данных</div>
        ) : (
          COLORS.map((color) => {
            const isUsed = usedItems.colors.has(color.value);
            const isSelected = formData.color === color.value;

            return (
              <button
                key={color.id}
                type="button"
                className={`h-10 w-10 rounded transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 border-primary"
                    : "border-secondary/30 hover:border-secondary/60 hover:scale-105"
                } disabled:opacity-30 disabled:pointer-events-none disabled:cursor-not-allowed`}
                style={{ backgroundColor: color.value }}
                onClick={() =>
                  !isUsed && handleInputChange("color")(color.value)
                }
                disabled={isUsed}
                title={isUsed ? "Цвет уже используется" : color.id}
              />
            );
          })
        )}
      </div>

      <span>АВАТАР</span>
      <div className="flex flex-wrap gap-2 min-h-12 justify-center">
        {isLoading ? (
          <div className="flex items-center gap-2 text-primary">
            <SmallLoader />
            <span className="text-sm">Загрузка доступных аватаров...</span>
          </div>
        ) : isError ? (
          <div className="text-primary text-sm">Ошибка загрузки данных</div>
        ) : (
          AVATARS.map((avatar) => {
            const isUsed = usedItems.avatars.has(avatar.symbol);
            const isSelected = formData.avatar === avatar.symbol;

            return (
              <button
                key={avatar.id}
                type="button"
                className={`h-10 w-10 rounded transition-all duration-200 flex items-center justify-center text-lg cursor-pointer ${
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 border-primary bg-primary/10"
                    : "border-secondary/30 hover:border-secondary/60 hover:scale-105"
                } disabled:opacity-30 disabled:pointer-events-none disabled:cursor-not-allowed`}
                onClick={() =>
                  !isUsed && handleInputChange("avatar")(avatar.symbol)
                }
                disabled={isUsed}
                title={isUsed ? "Аватар уже используется" : avatar.label}
              >
                {avatar.symbol}
              </button>
            );
          })
        )}
      </div>

      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? <SmallLoader /> : "СОЗДАТЬ АККАУНТ"}
      </Button>
    </main>
  );
}
