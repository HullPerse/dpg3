import { useRef, useState } from "react";
import { Image } from "@/components/shared/image.component";
import { Button } from "@/components/ui/button.component";
import Input from "@/components/ui/input.component";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import Toast from "@/components/ui/toast.component";
import { gameRewards } from "@/lib/utils";
import type { GameType } from "@/types/games";

export default function AddCustom({
  setOpen,
  setEdit,
}: Readonly<{
  setOpen: (open: boolean) => void;
  setEdit?: (game: GameType) => void;
}>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const websiteRef = useRef<HTMLInputElement>(null);
  const steamRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const scoreRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);

  const [time, setTime] = useState<number>(0);

  const previewTitle = titleRef.current?.value ?? "";
  const previewImage = imageRef.current?.value ?? "";

  const isValid = Boolean(
    (titleRef.current?.value ?? "").trim() &&
    (imageRef.current?.value ?? "").trim() &&
    Number(timeRef.current?.value ?? 0) >= 0,
  );

  const handleAdd = async () => {
    if (!isValid) {
      Toast(
        "Заполните все обязательные поля (Название, Изображение, Цена, Время)",
        "error",
      );
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: titleRef.current?.value.trim(),
        image: imageRef.current?.value.trim(),
        score: Number(scoreRef.current?.value ?? 0) || 0,
        steam: (steamRef.current?.value ?? "").trim(),
        website: (websiteRef.current?.value ?? "").trim(),
        time: Number(timeRef.current?.value ?? 0) || 0,
        price: (priceRef.current?.value ?? "").trim() || "Free",
        background: "",
      };

      setEdit?.(payload as GameType);

      setOpen(false);
    } catch {
      setError("Не удалось добавить игру");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col gap-4 p-2 ">
      <section className="flex flex-col gap-2">
        <Input placeholder="Название" ref={titleRef} className="w-full" />
        <Input
          placeholder="Ссылка на изображение"
          ref={imageRef}
          className="w-full"
        />
        <section className="flex w-full gap-2">
          <Input
            placeholder="Время прохождения (часы)"
            ref={timeRef}
            type="number"
            className="w-full"
            onChange={(e) => setTime(Number(e.target.value) || 0)}
          />
          <Input
            placeholder="Цена (напр. $9.99)"
            ref={priceRef}
            className="w-full"
          />
        </section>
        <section className="flex w-full gap-2">
          <Input
            placeholder="Оценка (кол-во отзывов/очков)"
            ref={scoreRef}
            type="number"
            className="w-full"
          />
          <Input placeholder="Ссылка Steam" ref={steamRef} className="w-full" />
        </section>
        <Input placeholder="Вебсайт" ref={websiteRef} className="w-full" />
      </section>

      {loading && <ModalLoading />}
      {error && <ModalError description={error} />}

      {(previewTitle || previewImage) && (
        <section className="flex flex-col gap-2 items-center">
          {previewTitle && (
            <span className="text-lg font-bold text-primary">
              {previewTitle}
            </span>
          )}
          {previewImage && (
            <div className="border border-primary rounded overflow-hidden aspect-video max-w-full">
              <Image
                src={previewImage}
                className="w-full h-full object-cover"
                alt={previewTitle || "preview"}
                loading="lazy"
              />
            </div>
          )}
          <section className="flex flex-row w-full h-full justify-center">
            <span className="flex justify-center w-full text-primary">
              [{gameRewards(time)}] Чубриков
            </span>
            <span className="flex justify-end w-full text-primary">
              [{(priceRef.current?.value ?? "").trim() || "Free"}]
            </span>
          </section>
        </section>
      )}

      <Button className="w-full" disabled={!isValid} onClick={handleAdd}>
        Добавить
      </Button>
    </main>
  );
}
