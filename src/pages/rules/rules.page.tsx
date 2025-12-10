import { useQuery } from "@tanstack/react-query";
import { BookAlert, Database, Footprints, Globe, Package } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion.component";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import { rules } from "@/config/rules.config";

const getIcon = (label: string) => {
  const iconMap = {
    Основное: <BookAlert />,
    "Правила хода": <Footprints />,
    Предметы: <Package />,
    Карта: <Globe />,
    "Запросы API": <Database />,
  };

  return iconMap[label as keyof typeof iconMap];
};

export default function Rules() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["rules"],
    queryFn: async () => {
      return rules;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  if (isLoading) return <ModalLoading />;
  if (isError) return <ModalError />;

  return (
    <main className="flex flex-col gap-2 overflow-x-hidden">
      <Accordion type="multiple">
        {data?.map((item) => {
          return (
            <AccordionItem key={item.label} value={item.label}>
              <AccordionTrigger className="font-bold text-xl flex">
                <div className="flex flex-row gap-5 items-center justify-center">
                  {getIcon(item.label)} {item.label}
                </div>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2 font-bold text-md text-muted text-start">
                {item.content.map((content) => (
                  <p key={content}>{content}</p>
                ))}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </main>
  );
}
