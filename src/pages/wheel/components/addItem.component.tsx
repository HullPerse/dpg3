import { useQueryClient } from "@tanstack/react-query";
import { Upload, X } from "lucide-react";
import { useState } from "react";
import ItemsApi from "@/api/items.api";
import { Image } from "@/components/shared/image.component";
import { Button } from "@/components/ui/button.component";
import Input from "@/components/ui/input.component";
import { SmallLoader } from "@/components/ui/loader.components";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.component";
import { Switch } from "@/components/ui/switch.component";
import Toast from "@/components/ui/toast.component";
import { cn } from "@/lib/utils";

export default function AddItem({
  setOpenAddItem,
}: Readonly<{
  setOpenAddItem: (open: boolean) => void;
}>) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"бафф" | "дебафф" | null>(null);
  const [rollable, setRollable] = useState(true);
  const [charges, setCharges] = useState<number | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [usage, setUsage] = useState(false);
  const [auto, setAuto] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return Toast("ВВЕДИТЕ НАЗВАНИЕ ПРЕДМЕТА", "error");
    if (!description.trim()) return Toast("ВВЕДИТЕ ОПИСАНИЕ ПРЕДМЕТА", "error");
    if (!image) return Toast("ДОБАВЬТЕ ИЗОБРАЖЕНИЕ ПРЕДМЕТА", "error");
    if (charges && charges < 0)
      return Toast("ЗАРЯДЫ НЕ МОГУТ БЫТЬ ОТРИЦАТЕЛЬНЫМИ", "error");

    try {
      setLoading(true);
      const itemData = {
        label: title.trim(),
        description: description.trim(),
        type: type || null,
        rollable: rollable,
        charge: charges || null,
        image: image,
        usage: usage,
        auto: auto,
        effect: "",
      };

      await new ItemsApi().addNewItem(itemData);

      queryClient.invalidateQueries({ queryKey: ["itemList"] });
      Toast("ПРЕДМЕТ УСПЕШНО СОЗДАН", "success");
      setOpenAddItem(false);
    } catch (error) {
      console.error("Ошибка при создании предмета", error);
      Toast("ОШИБКА ПРИ СОЗДАНИИ ПРЕДМЕТА", "error");
    }

    setLoading(false);
  };

  return (
    <main className="flex flex-col gap-4 w-full p-4">
      {/* Image Upload */}
      <section className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Изображение</span>
        {imagePreview ? (
          <div className="relative w-full h-48 border border-primary/50 rounded-lg overflow-hidden bg-background/40">
            <Image
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-contain p-2"
              loading="lazy"
            />
            <Button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1.5 rounded bg-background/80 hover:bg-background border border-primary/50 transition-all"
            >
              <X className="size-4 text-foreground" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/50 rounded-lg cursor-pointer hover:border-primary transition-colors bg-background/30 hover:bg-background/50">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="size-8 mb-2 text-primary opacity-70" />
              <p className="mb-2 text-sm text-foreground">
                <span className="font-semibold">Добавить изображение</span>
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>
        )}
      </section>

      {/* Title */}
      <section className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Название *</span>
        <Input
          type="text"
          placeholder="Введите название предмета"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full"
        />
      </section>

      {/* Description */}
      <section className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Описание *</span>
        <textarea
          placeholder="Введите описание предмета"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
            "dark:bg-input/30 flex w-full min-w-0 bg-transparent px-3 py-2 text-base",
            "shadow-xs transition-[color,box-shadow] outline-none",
            "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "rounded border border-primary selection:bg-primary/50 resize-none",
          )}
        />
      </section>

      {/* Type */}
      <section className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Тип</span>
        <Select
          value={type || "none"}
          onValueChange={(value) =>
            setType(
              value === "none" ? null : (value as "бафф" | "дебафф" | null),
            )
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Без типа</SelectItem>
            <SelectItem value="бафф">бафф</SelectItem>
            <SelectItem value="дебафф">дебафф</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {/* Rollable */}
      <section className="flex items-center justify-between gap-4 p-3 border border-primary/50 rounded-lg bg-background/30">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            Можно выбить на колесе
          </span>
        </div>
        <Switch checked={rollable} onCheckedChange={setRollable} />
      </section>

      {/* Usage */}
      <section className="flex items-center justify-between gap-4 p-3 border border-primary/50 rounded-lg bg-background/30">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            Использовать сразу после выпадения
          </span>
        </div>
        <Switch checked={usage} onCheckedChange={setUsage} />
      </section>

      {/* Auto */}
      <section className="flex items-center justify-between gap-4 p-3 border border-primary/50 rounded-lg bg-background/30">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            Используется автоматически
          </span>
        </div>
        <Switch checked={auto} onCheckedChange={setAuto} />
      </section>

      {/* Charges */}
      <section className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Заряды</span>
        <Input
          type="number"
          placeholder="Введите количество зарядов (0 или пусто = без зарядов)"
          value={charges ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            setCharges(Number(value) || 0);
          }}
          className="w-full"
        />
      </section>

      {/* Submit Button */}
      <Button onClick={handleSubmit} disabled={loading} className="w-full mt-2">
        {loading ? <SmallLoader /> : "СОЗДАТЬ ПРЕДМЕТ"}
      </Button>
    </main>
  );
}
