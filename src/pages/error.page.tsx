import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center gap-6 p-8 text-center text-xl font-bold">
      <AlertTriangle className="h-16 w-16 text-primary" />
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-primary">404</h2>
        <p className="text-primary font-mono">Страница не найдена</p>
      </div>
    </main>
  );
}
