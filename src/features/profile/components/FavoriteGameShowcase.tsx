import { useDeferredValue, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFavoriteGame } from "@/hooks/useFavoriteGame";
import { useMaturePreference } from "@/hooks/useMaturePreference";
import { useUserGames, useEnsureFavoriteGame } from "@/hooks/useUserGames";
import { useGamesByIds, useSearchCatalog } from "@/hooks/useGames";
import { useUpdateProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { isMatureGame } from "@/lib/matureFilter";

export function FavoriteGameShowcase({
  userId,
  appId,
  editable = false,
}: {
  userId?: string;
  appId?: number | null;
  editable?: boolean;
}) {
  const { data: favorite } = useFavoriteGame(userId, appId);
  const [showMature] = useMaturePreference();
  const [editing, setEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const { data: library = [] } = useUserGames(undefined, true, editable);
  const visibleLibrary = library.filter((entry) => !entry.is_private && !entry.is_hidden);
  const { data: libraryChoices = [] } = useGamesByIds(visibleLibrary.map((entry) => entry.app_id));
  const normalizedQuery = deferredQuery.trim();
  const isSearching = normalizedQuery.length >= 2;
  const { data: searchResults = [], isFetching: searchLoading } = useSearchCatalog(
    normalizedQuery,
    18,
  );
  const updateProfile = useUpdateProfile();
  const ensureFavorite = useEnsureFavoriteGame();
  const { toast } = useToast();
  const visibleFavorite = favorite && (showMature || !isMatureGame(favorite)) ? favorite : null;
  const choices = (isSearching ? searchResults : libraryChoices)
    .filter((game) => showMature || !isMatureGame(game))
    .sort((a, b) => a.title.localeCompare(b.title));
  const isSaving = updateProfile.isPending || ensureFavorite.isPending;

  const choose = async (selectedAppId: number) => {
    try {
      await ensureFavorite.mutateAsync(selectedAppId);
      await updateProfile.mutateAsync({ favorite_game_app_id: selectedAppId });
      toast({ title: "Jogo favorito atualizado e salvo na sua biblioteca." });
      setEditing(false);
      setSearchQuery("");
    } catch (error) {
      toast({
        title: "Não foi possível atualizar o destaque.",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setEditing(open);
    if (!open) setSearchQuery("");
  };

  if (!visibleFavorite && !editable) return null;

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-border bg-background/25">
        <header className="flex flex-col items-start justify-between gap-1.5 border-b border-border px-4 py-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-3">
          <div>
            <p className="eyebrow">Destaque pessoal</p>
            <h2 className="mt-1 text-sm font-semibold">Jogo favorito</h2>
          </div>
          {editable && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              {visibleFavorite ? "Trocar jogo" : "Escolher jogo"}
            </button>
          )}
        </header>
        {visibleFavorite ? (
          <div className="grid sm:grid-cols-[13rem_minmax(0,1fr)]">
            <img
              src={visibleFavorite.image}
              alt={visibleFavorite.title}
              className="aspect-[460/215] h-full w-full object-cover"
            />
            <div className="min-w-0 border-t border-border p-4 sm:border-l sm:border-t-0 sm:p-5">
              <p className="text-lg font-semibold leading-tight">{visibleFavorite.title}</p>
              {visibleFavorite.hoursPlayed != null && (
                <div className="mt-5 border-l-2 border-primary pl-3">
                  <p className="text-2xl font-light leading-none">
                    {visibleFavorite.hoursPlayed.toLocaleString("pt-BR", {
                      maximumFractionDigits: 1,
                    })}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Horas registradas</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Escolha qualquer jogo do catálogo. Se ele ainda não estiver na sua biblioteca, será
              adicionado automaticamente.
            </p>
            <Button size="sm" variant="outline" className="mt-4" onClick={() => setEditing(true)}>
              Pesquisar jogo favorito
            </Button>
          </div>
        )}
      </section>

      <Dialog open={editing} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Escolher jogo favorito</DialogTitle>
            <DialogDescription>
              Pesquise o catálogo inteiro. Ao escolher, o jogo também será adicionado à sua
              biblioteca.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Pesquisar pelo nome do jogo..."
              aria-label="Pesquisar jogo favorito"
              autoFocus
              className="pl-9"
            />
          </div>

          <div className="flex min-h-5 items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {isSearching ? "Resultados do catálogo" : "Jogos que já estão na sua biblioteca"}
            </span>
            {searchLoading && (
              <span className="inline-flex items-center gap-1.5" aria-live="polite">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                Buscando
              </span>
            )}
          </div>

          <div className="grid max-h-[52vh] gap-2 overflow-y-auto sm:grid-cols-2">
            {choices.map((game) => (
              <button
                key={game.app_id}
                type="button"
                onClick={() => choose(game.app_id)}
                disabled={isSaving}
                className={`flex min-w-0 items-center gap-3 rounded-md border p-2 text-left transition-colors hover:border-primary/60 hover:bg-secondary/50 ${game.app_id === appId ? "border-primary bg-primary/10" : "border-border"}`}
              >
                <img
                  src={game.image}
                  alt=""
                  className="aspect-[460/215] h-12 w-20 shrink-0 rounded object-cover"
                />
                <span className="min-w-0 truncate text-sm">{game.title}</span>
              </button>
            ))}
            {!searchLoading && isSearching && choices.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                Nenhum jogo encontrado para “{normalizedQuery}”.
              </p>
            )}
            {!isSearching && choices.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                Digite ao menos duas letras para pesquisar todo o catálogo.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
