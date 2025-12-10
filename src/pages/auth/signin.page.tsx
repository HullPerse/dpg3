import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button.component";
import Input from "@/components/ui/input.component";
import { SmallLoader } from "@/components/ui/loader.components";
import Toast from "@/components/ui/toast.component";
import { useLoginStore } from "@/store/login.store";

const signinSchema = z.object({
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
});

type SigninFormData = z.infer<typeof signinSchema>;

export default function Login() {
  const login = useLoginStore((state) => state.login);

  const [formData, setFormData] = useState<SigninFormData>({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof SigninFormData, string>>
  >({});

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleInputChange =
    (field: keyof SigninFormData) => (value: string) => {
      let processedValue = value;

      if (field === "username") {
        processedValue = value.replaceAll(/[^a-zA-Z0-9]/g, "");
      }

      setFormData((prev) => ({ ...prev, [field]: processedValue }));

      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };

  const handleLogin = async () => {
    setLoading(true);
    const result = signinSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SigninFormData, string>> = {};

      result.error.issues.forEach((issue) => {
        if (issue.path.length > 0) {
          const field = issue.path[0] as keyof SigninFormData;
          fieldErrors[field] = issue.message;
        }
      });

      setErrors(fieldErrors);
      // Show only the first error in toast
      Toast(result.error.issues[0].message, "error");
      setLoading(false);

      return;
    }

    try {
      await login(
        `${formData.username.toUpperCase()}@notEmail.com`,
        formData.password,
      );
      setLoading(false);
      Toast("ВЫ УСПЕШНО ВОШЛИ В АККАУНТ", "success");
      navigate({ to: "/menu" });
    } catch (error) {
      console.error("Login error:", error);
      setErrors({
        username: "Неверное имя пользователя или пароль",
        password: "Неверное имя пользователя или пароль",
      });
      Toast("НЕВЕРНОЕ ИМЯ ПОЛЬЗОВАТЕЛЯ ИЛИ ПАРОЛЬ", "error");
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <main
      className="flex w-full flex-col gap-2 p-2 leading-tight text-start"
      onKeyDown={handleKeyDown}
    >
      <span>ИМЯ ПОЛЬЗОВАТЕЛЯ</span>
      <Input
        type="text"
        autoFocus
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
        disabled={loading}
      />

      <span>ПАРОЛЬ</span>
      <Input
        type="password"
        value={formData.password}
        onChange={(e) => handleInputChange("password")(e.target.value)}
        placeholder="Введите пароль"
        disabled={loading}
      />

      <Button onClick={handleLogin} disabled={loading}>
        {loading ? <SmallLoader /> : "ВОЙТИ В АККАУНТ"}
      </Button>
    </main>
  );
}
