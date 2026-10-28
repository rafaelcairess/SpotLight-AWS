/** Category page backed by an explicitly curated game list. */

import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageContainer, PageShell } from "@/components/PageShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { CATEGORY_GAME_IDS } from "@/features/collections/data/categoryGameIds";
import { GameGrid } from "@/features/games/components/GameGrid";
import GameModal from "@/features/games/components/GameModal";
import { useGameSelection } from "@/features/games/hooks/useGameSelection";
import { useGamesByIds } from "@/hooks/useGames";
import { CATEGORIES } from "@/types/game";

export default function CollectionDetail() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t } = useTranslation();
  const { selectedGame, isGameOpen, openGame, closeGame } = useGameSelection();
  const category = CATEGORIES.find((item) => item.id === categoryId);
  const manualIds = useMemo(
    () => (categoryId ? (CATEGORY_GAME_IDS[categoryId] ?? []) : []),
    [categoryId],
  );
  const { data: manualGames = [], isLoading } = useGamesByIds(manualIds);

  const games = useMemo(() => {
    const order = new Map(manualIds.map((id, index) => [id, index]));
    return [...manualGames].sort(
      (first, second) =>
        (order.get(first.app_id) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(second.app_id) ?? Number.MAX_SAFE_INTEGER),
    );
  }, [manualGames, manualIds]);

  if (!category) {
    return (
      <PageShell>
        <PageContainer className="flex min-h-[60vh] items-center justify-center pb-12">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">{t("collections.notFoundTitle")}</h1>
            <Button asChild>
              <Link to="/collections">{t("collectionDetail.back")}</Link>
            </Button>
          </div>
        </PageContainer>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageContainer className="pb-12">
        <Link
          to="/collections"
          className="mb-8 inline-flex min-h-11 items-center gap-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("collectionDetail.back")}
        </Link>

        <section className="mb-10 grid border-y border-border lg:grid-cols-[minmax(0,0.8fr)_minmax(26rem,1.2fr)]">
          <div className="flex flex-col justify-center py-8 pr-0 sm:py-10 lg:pr-10">
            <span className="mb-5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
              {t("collectionDetail.curatedCount", { count: manualIds.length })}
            </span>
            <h1 className="mb-3 text-4xl font-extrabold tracking-[-0.045em] md:text-5xl">
              {t(`categories.${category.id}.name`, { defaultValue: category.name })}
            </h1>
            <p className="max-w-lg text-sm leading-7 text-muted-foreground">
              {t(`categories.${category.id}.description`, { defaultValue: category.description })}
            </p>
          </div>
          <div className="relative min-h-64 border-t border-border bg-muted lg:min-h-80 lg:border-l lg:border-t-0">
            {games[0] ? (
              <img
                src={games[0].image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                fetchPriority="high"
              />
            ) : null}
          </div>
        </section>

        {isLoading ? (
          <LoadingSkeleton variant="card" count={6} />
        ) : games.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {t("collectionDetail.empty")}
          </div>
        ) : (
          <GameGrid
            games={games}
            layout="posters"
            posterColumns={5}
            cardAppearance="editorial"
            onGameSelect={openGame}
          />
        )}
      </PageContainer>

      <GameModal game={selectedGame} isOpen={isGameOpen} onClose={closeGame} />
    </PageShell>
  );
}
