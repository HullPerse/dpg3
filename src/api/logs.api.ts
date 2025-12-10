import type { LogType } from "@/types/log";
import { client } from "./client.api";

export default class LogsApi {
  createLog = async ({
    type,
    sender,
    receiver,
    label,
    image,
  }: {
    type: LogType["type"];
    sender: {
      id: string;
      username: string;
    };
    receiver?: {
      id: string;
      username: string;
    };
    label?: string;
    image?: string;
  }) => {
    return await client.collection("logs").create({
      sender: {
        id: sender.id,
        username: sender.username,
      },
      receiver: {
        id: receiver?.id,
        username: receiver?.username,
      },
      type,
      text: getLogText(sender.username, type, receiver?.username, label, image),
      image: image ?? null,
    });
  };

  getLogs = async () => {
    return await client.collection("logs").getFullList();
  };

  getLogsByUser = async (username: string) => {
    return await client.collection("logs").getFullList({
      filter: `sender.username = "${username}" || receiver.username = "${username}"`,
    });
  };
}

const getLogText = (
  sender: string,
  type: LogType["type"],
  receiver?: string,
  item?: string,
  status?: string,
) => {
  const senderUp = sender.toUpperCase();
  const receiverPart = receiver
    ? ` игроку ${receiver.toUpperCase()}`
    : " [неизвестному игроку]";
  const safeItem = item ?? "[неизвестный предмет]";
  const safeStatus = status ?? "[неизвестно]";

  const TextMap = {
    newItem: `${senderUp} добавил ${safeItem} в инвентарь`,
    sendItem: `${senderUp} отправил ${safeItem}${receiverPart}`,
    useItem: `${senderUp} использовал ${safeItem}`,
    newGame: `${senderUp} зароллил игру ${safeItem}`,
    gameStatus: `${senderUp} сменил статус ${safeItem} на ${safeStatus}`,
    takeCell: `${senderUp} захватил клетку ${safeItem}`,
    dropCell: `${senderUp} дропнул клетку ${safeItem}`,
    moveUser: `${senderUp} переместился на клетку ${safeItem}`,
  };

  return (
    TextMap[type as keyof typeof TextMap] ??
    `${senderUp} совершил действие ${type}`
  ).trim();
};
