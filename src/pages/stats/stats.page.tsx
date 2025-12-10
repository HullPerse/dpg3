import { useQuery, useQueryClient } from "@tanstack/react-query";
import { lazy, memo, useCallback } from "react";
import GamesApi from "@/api/games.api";
import MapApi from "@/api/map.api";
import UsersApi from "@/api/users.api";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import { statData } from "@/config/stats.config";
import { useSubscription } from "@/hooks/useSubscription";

const Card = lazy(() => import("@/pages/stats/components/card.component"));

function Stats() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const allUsers = await new UsersApi().getUsers();
      const stats = statData;
      const allGames = await new GamesApi().getGames();
      const allCells = await new MapApi().getCellInfo();
      const userStats = {
        moneyStat: () => {
          return allUsers.map((user) => {
            const moneyAmount = user.data.money.total;
            return {
              color: user.color,
              username: user.username,
              moneyAmount: moneyAmount,
            };
          });
        },
        startStat: () => {
          return allUsers.map((user) => {
            const startAmount = user.data.totalFinish;
            return {
              color: user.color,
              username: user.username,
              startAmount: startAmount,
            };
          });
        },
      };
      const userGames = {
        dropGames: () => {
          return allUsers.map((user) => {
            const droppedCount = allGames.filter(
              (game) => game.status === "DROPPED" && game.user.id === user.id,
            ).length;
            return {
              color: user.color,
              username: user.username,
              droppedAmount: droppedCount,
            };
          });
        },
        completedGames: () => {
          return allUsers.map((user) => {
            const completedAmount = allGames.filter(
              (game) => game.status === "COMPLETED" && game.user.id === user.id,
            ).length;
            return {
              color: user.color,
              username: user.username,
              completedAmount: completedAmount,
            };
          });
        },
        capturedCells: () => {
          return allUsers.map((user) => {
            const cellCount = allCells.filter(
              (cell) => cell.user?.userId === user.id,
            ).length;
            return {
              color: user.color,
              username: user.username,
              capturedAmount: cellCount,
            };
          });
        },
        completedGamesInRow: () => {
          return allUsers.map((user) => {
            const userGames = allGames
              .filter((game) => game.user.id === user.id)
              .sort((a, b) => a.createdAt - b.createdAt);
            let maxStreak = 0;
            let currentStreak = 0;
            for (const game of userGames) {
              if (game.status === "COMPLETED") {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
              } else if (game.status === "DROPPED") {
                currentStreak = 0;
              }
            }
            return {
              color: user.color,
              username: user.username,
              completedAmount: maxStreak,
            };
          });
        },
        allGameTime: () => {
          return allUsers.map((user) => {
            const userGames = allGames
              .filter((game) => game.user.id === user.id)
              .sort((a, b) => a.data.time - b.data.time);
            let allTime = 0;
            for (const game of userGames) {
              if (!game.data.time) continue;
              allTime += game.data.time;
            }
            return {
              color: user.color,
              username: user.username,
              allTimeAmount: allTime,
            };
          });
        },
        allReviews: () => {
          return allUsers.map((user) => {
            const userGames = allGames
              .filter((game) => game.user.id === user.id)
              .sort((a, b) => a.reviewText - b.reviewText);
            let allReviews = 0;
            for (const game of userGames) {
              if (game.reviewText) {
                allReviews += 1;
              }
            }
            return {
              color: user.color,
              username: user.username,
              allReviewsAmount: allReviews,
            };
          });
        },
        gameTime: () => {
          return allUsers.map((user) => {
            const userGames = allGames
              .filter(
                (game) =>
                  game.user.id === user.id &&
                  ["COMPLETED", "PLAYING"].includes(game.status),
              )
              .sort((a, b) => a.data.time - b.data.time);
            let maxTime = 0;
            for (const game of userGames) {
              if (!game.data.time) continue;
              if (game.data.time > maxTime) {
                maxTime = game.data.time;
              }
            }
            return {
              color: user.color,
              username: user.username,
              timeAmount: maxTime,
            };
          });
        },
        allTrophies: () => {
          return allUsers.map((user) => {
            let trophyCount = 0;
            const droppedData = userGames.dropGames().sort((a, b) => {
              if (b.droppedAmount < a.droppedAmount) return 1;
              if (b.droppedAmount > a.droppedAmount) return -1;
              return 0;
            });
            const completedData = userGames.completedGames().sort((a, b) => {
              if (b.completedAmount > a.completedAmount) return 1;
              if (b.completedAmount < a.completedAmount) return -1;
              return 0;
            });
            const completedInRowData = userGames
              .completedGamesInRow()
              .sort((a, b) => {
                if (b.completedAmount > a.completedAmount) return 1;
                if (b.completedAmount < a.completedAmount) return -1;
                return 0;
              });
            const capturedCellsData = userGames.capturedCells().sort((a, b) => {
              if (b.capturedAmount > a.capturedAmount) return 1;
              if (b.capturedAmount < a.capturedAmount) return -1;
              return 0;
            });
            const moneyData = userStats.moneyStat().sort((a, b) => {
              if (b.moneyAmount > a.moneyAmount) return 1;
              if (b.moneyAmount < a.moneyAmount) return -1;
              return 0;
            });
            const startData = userStats.startStat().sort((a, b) => {
              if (b.startAmount > a.startAmount) return 1;
              if (b.startAmount < a.startAmount) return -1;
              return 0;
            });
            const timeData = userGames.gameTime().sort((a, b) => {
              if (b.timeAmount > a.timeAmount) return 1;
              if (b.timeAmount < a.timeAmount) return -1;
              return 0;
            });
            const allTimeData = userGames.allGameTime().sort((a, b) => {
              if (b.allTimeAmount > a.allTimeAmount) return 1;
              if (b.allTimeAmount < a.allTimeAmount) return -1;
              return 0;
            });
            const allReviewsData = userGames.allReviews().sort((a, b) => {
              if (b.allReviewsAmount > a.allReviewsAmount) return 1;
              if (b.allReviewsAmount < a.allReviewsAmount) return -1;
              return 0;
            });
            if (droppedData[0]?.username === user.username) {
              trophyCount++;
            }
            if (completedData[0]?.username === user.username) {
              trophyCount++;
            }
            if (completedInRowData[0]?.username === user.username) {
              trophyCount++;
            }
            if (capturedCellsData[0]?.username === user.username) {
              trophyCount++;
            }
            if (moneyData[0]?.username === user.username) {
              trophyCount++;
            }
            if (startData[0]?.username === user.username) {
              trophyCount++;
            }
            if (timeData[0]?.username === user.username) {
              trophyCount++;
            }
            if (allTimeData[0]?.username === user.username) {
              trophyCount++;
            }
            if (allReviewsData[0]?.username === user.username) {
              trophyCount++;
            }
            return {
              color: user.color,
              username: user.username,
              trophyCount: trophyCount,
            };
          });
        },
      };
      return { stats, userStats, userGames, allGames };
    },
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  const invalidateStats = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["stats"],
      refetchType: "all",
    });
  }, [queryClient]);

  useSubscription("users", "*", invalidateStats);
  useSubscription("games", "*", invalidateStats);
  useSubscription("cells", "*", invalidateStats);

  if (isLoading) return <ModalLoading />;
  if (isError) return <ModalError />;

  return (
    <main className="flex flex-col p-2 gap-2 items-center justify-center w-full">
      {data?.stats
        .filter((item) => item.row === 1)
        .map((item) => (
          <Card
            key={item.label}
            item={item}
            allTrophies={data.userGames.allTrophies().sort((a, b) => {
              if (b.trophyCount > a.trophyCount) return 1;
              if (b.trophyCount < a.trophyCount) return -1;
              return 0;
            })}
          />
        ))}
      <section className="w-full flex 2xl:flex-row flex-col gap-2 items-center">
        {data?.stats
          .filter((item) => item.row === 2)
          .map((item) => {
            if (item.label === "Ветеран") {
              return (
                <Card
                  key={item.label}
                  item={item}
                  completedGames={data?.userGames
                    .completedGames()
                    .sort((a, b) => {
                      if (b.completedAmount > a.completedAmount) return 1;
                      if (b.completedAmount < a.completedAmount) return -1;
                      return 0;
                    })}
                />
              );
            }
            if (item.label === "Захватчик") {
              return (
                <Card
                  key={item.label}
                  item={item}
                  capturedCells={data?.userGames
                    .capturedCells()
                    .sort((a, b) => {
                      if (b.capturedAmount > a.capturedAmount) return 1;
                      if (b.capturedAmount < a.capturedAmount) return -1;
                      return 0;
                    })}
                />
              );
            }
            if (item.label === "Непрерывный поток") {
              return (
                <Card
                  key={item.label}
                  item={item}
                  completedGamesInRow={data?.userGames
                    .completedGamesInRow()
                    .sort((a, b) => {
                      if (b.completedAmount > a.completedAmount) return 1;
                      if (b.completedAmount < a.completedAmount) return -1;
                      return 0;
                    })}
                />
              );
            }
            return <Card key={item.label} item={item} />;
          })}
      </section>
      <section className="w-full flex 2xl:flex-row flex-col gap-2 items-center">
        {data?.stats
          .filter((item) => item.row === 3)
          .map((item) => {
            if (item.label === "Чубриковый магнат") {
              return (
                <Card
                  key={item.label}
                  item={item}
                  money={data?.userStats.moneyStat().sort((a, b) => {
                    if (b.moneyAmount > a.moneyAmount) return 1;
                    if (b.moneyAmount < a.moneyAmount) return -1;
                    return 0;
                  })}
                />
              );
            }
            if (item.label === "Мастер кругов") {
              return (
                <Card
                  key={item.label}
                  item={item}
                  start={data?.userStats.startStat().sort((a, b) => {
                    if (b.startAmount > a.startAmount) return 1;
                    if (b.startAmount < a.startAmount) return -1;
                    return 0;
                  })}
                />
              );
            }
            if (item.label === "Стабильный") {
              return (
                <Card
                  key={item.label}
                  item={item}
                  droppedGames={data?.userGames.dropGames().sort((a, b) => {
                    if (b.droppedAmount < a.droppedAmount) return 1;
                    if (b.droppedAmount > a.droppedAmount) return -1;
                    return 0;
                  })}
                />
              );
            }
            return <Card key={item.label} item={item} />;
          })}
      </section>
      <section className="w-full flex 2xl:flex-row flex-col gap-2 items-center">
        {data?.stats
          .filter((item) => item.row === 4)
          .map((item) => {
            if (item.label === "Марафонец") {
              return (
                <Card
                  key={item.label}
                  item={item}
                  time={data?.userGames.gameTime().sort((a, b) => {
                    if (b.timeAmount > a.timeAmount) return 1;
                    if (b.timeAmount < a.timeAmount) return -1;
                    return 0;
                  })}
                />
              );
            }
            if (item.label === "Диванный критик") {
              return (
                <Card
                  key={item.label}
                  item={item}
                  allReviews={data?.userGames.allReviews().sort((a, b) => {
                    if (b.allReviewsAmount > a.allReviewsAmount) return 1;
                    if (b.allReviewsAmount < a.allReviewsAmount) return -1;
                    return 0;
                  })}
                />
              );
            }
            if (item.label === "Вечный двигатель") {
              return (
                <Card
                  key={item.label}
                  item={item}
                  allTime={data?.userGames.allGameTime().sort((a, b) => {
                    if (b.allTimeAmount > a.allTimeAmount) return 1;
                    if (b.allTimeAmount < a.allTimeAmount) return -1;
                    return 0;
                  })}
                />
              );
            }
            return <Card key={item.label} item={item} />;
          })}
      </section>
    </main>
  );
}

export default memo(Stats);
