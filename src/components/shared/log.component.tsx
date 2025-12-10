import { memo } from "react";
import { Image } from "@/components/shared/image.component";
import type { LogType } from "@/types/log";

const LogCard = memo(({ log }: Readonly<{ log: LogType }>) => {
  return (
    <main className="relative flex flex-row w-full border border-primary rounded p-2 h-24 items-center font-bold gap-4">
      {log.image && (
        <section
          className={`h-20 border border-primary rounded overflow-hidden ${
            ["newItem", "sendItem"].includes(log.type) ? "w-20" : "w-40"
          }`}
        >
          <Image
            src={log.image}
            alt={String(log.text)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </section>
      )}
      <section>{log.text}</section>
      <span className="absolute right-2 top-2 text-xs text-muted opacity-70">
        {log.updated}
      </span>
    </main>
  );
});

export default LogCard;
