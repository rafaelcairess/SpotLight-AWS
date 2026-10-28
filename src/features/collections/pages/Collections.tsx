import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { PageContainer, PageShell } from "@/components/PageShell";
import CategoryCard from "@/features/collections/components/CategoryCard";
import SectionHeader from "@/components/SectionHeader";
import { CATEGORIES } from "@/types/game";
import { useTranslation } from "react-i18next";
import {
  CATEGORY_FEATURED_GAME_IDS,
  CATEGORY_FEATURED_GAME_TITLES,
  CATEGORY_GAME_IDS,
} from "@/features/collections/data/categoryGameIds";
import { useGamesByIds } from "@/hooks/useGames";
import { getHeaderImage } from "@/lib/steam";

const featuredCategories = CATEGORIES.filter((category) => category.featured);
const otherCategories = CATEGORIES.filter((category) => !category.featured);
const collectionPreviewIds = CATEGORIES.map(
  (category) => CATEGORY_FEATURED_GAME_IDS[category.id] ?? CATEGORY_GAME_IDS[category.id]?.[0],
).filter((appId): appId is number => appId !== undefined);

const Collections = () => {
  const { t } = useTranslation();
  const { data: previewGames = [] } = useGamesByIds(collectionPreviewIds);
  const previewMap = useMemo(
    () => new Map(previewGames.map((game) => [game.app_id, game])),
    [previewGames],
  );
  const getPreviewGames = (categoryId: string) => {
    const appId = CATEGORY_FEATURED_GAME_IDS[categoryId] ?? CATEGORY_GAME_IDS[categoryId]?.[0];
    const game = appId ? previewMap.get(appId) : undefined;
    if (game) return [game];
    if (!appId) return [];
    return [
      {
        app_id: appId,
        title: CATEGORY_FEATURED_GAME_TITLES[categoryId] ?? "",
        image: getHeaderImage(appId),
      },
    ];
  };

  return (
    <PageShell>
      <PageContainer className="pb-12">
        <div className="mb-14 grid border-b border-border pb-9 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)] md:items-end md:gap-10">
          <div>
            <p className="eyebrow mb-4">{t("collections.title")}</p>
            <h1 className="mb-4 text-4xl font-extrabold tracking-[-0.045em] md:text-6xl">
              {t("collections.heading")}
            </h1>
          </div>
          <p className="max-w-lg text-sm leading-7 text-muted-foreground md:pb-1">
            {t("collections.subtitle")}
          </p>
        </div>

        <div className="mb-10">
          <SectionHeader
            title={t("collections.featuredTitle")}
            subtitle={t("collections.featuredSubtitle")}
            icon={Sparkles}
            appearance="editorial"
          />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {featuredCategories.map((category, idx) => (
              <CategoryCard
                key={category.id}
                category={category}
                index={idx}
                previewGames={getPreviewGames(category.id)}
                variant="featured"
              />
            ))}
          </div>
        </div>

        <SectionHeader
          title={t("collections.otherTitle")}
          subtitle={t("collections.exploreMore")}
          icon={Sparkles}
          appearance="editorial"
        />
        <div className="grid grid-cols-1 border-t border-border lg:grid-cols-2 lg:gap-x-8">
          {otherCategories.map((category, idx) => (
            <CategoryCard
              key={category.id}
              category={category}
              index={idx}
              previewGames={getPreviewGames(category.id)}
              variant="row"
            />
          ))}
        </div>
      </PageContainer>

      <footer className="border-t border-border bg-card py-10">
        <PageContainer className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark decorative className="h-11 w-11 rounded-full" />
            <span className="font-brand text-lg font-bold">SpotLight</span>
          </div>
          <p className="max-w-md text-sm text-muted-foreground sm:text-right">
            {t("home.footerTagline")}
          </p>
        </PageContainer>
      </footer>
    </PageShell>
  );
};

export default Collections;
