import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import Header from "@/components/Header";
import { Tabs } from "@/components/ui/tabs";
import { ProfileTabBar } from "@/features/profile/components/ProfileTabBar";
import { PlatformChoices } from "@/features/profile/components/PlatinumPlatformSelector";
import { GameModalHeader } from "@/features/games/components/modal/GameModalHeader";
import CategoryCard from "@/features/collections/components/CategoryCard";
import type { GameData } from "@/types/game";
import type { CategoryData } from "@/types/game";

const mockAuthState = vi.hoisted(() => ({
  user: null as { id: string } | null,
  loading: false,
  signOut: vi.fn(),
}));

vi.mock("@/components/LanguageSwitcher", () => ({
  default: () => <button type="button">PT</button>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ locale: "pt" }),
}));

vi.mock("@/hooks/useProfile", () => ({
  useProfile: () => ({ data: null }),
}));

vi.mock("@/hooks/useFriendships", () => ({
  useFriendRequests: () => ({ data: { incoming: [], outgoing: [] } }),
}));

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({ data: [], isLoading: false }),
  useMarkNotificationRead: () => ({ mutate: vi.fn() }),
  useMarkAllNotificationsRead: () => ({ mutate: vi.fn(), isPending: false }),
}));

const game: GameData = {
  app_id: 123,
  title: "Premium Test Game",
  image: "https://example.com/game.jpg",
  genre: "RPG",
  activePlayers: 1200,
  communityRating: 92,
  price: "R$ 99,90",
};

let host: HTMLDivElement;
let root: Root;

function app(ui: ReactNode, route = "/") {
  return (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </I18nextProvider>
  );
}

function renderApp(ui: ReactNode, route = "/") {
  act(() => root.render(app(ui, route)));
}

function findButton(name: string) {
  return Array.from(host.querySelectorAll("button")).find(
    (button) => button.textContent?.trim() === name,
  );
}

describe("premium UI variants", () => {
  beforeEach(async () => {
    mockAuthState.user = null;
    mockAuthState.signOut.mockClear();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await i18n.changeLanguage("pt");
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it("marks the rankings group active and closes the mobile menu with Escape", () => {
    renderApp(<Header />, "/top");

    expect(findButton("Rankings")).toHaveClass(
      "text-foreground",
      "after:scale-x-100",
      "after:bg-primary",
    );
    const menuButton = host.querySelector<HTMLButtonElement>('[aria-label="Abrir menu"]');
    expect(menuButton).not.toBeNull();

    act(() => menuButton?.click());
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(document.body.style.overflow).toBe("hidden");
    expect(host.querySelector("#mobile-navigation")).toHaveClass(
      "h-[calc(100dvh-5rem-env(safe-area-inset-top))]",
    );

    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(document.body.style.overflow).toBe("");
  });

  it("keeps ranking navigation textual and uses a dollar sign for promotions", () => {
    renderApp(<Header />);

    const promotionsLink = Array.from(host.querySelectorAll("a")).find((link) =>
      link.textContent?.includes("Promoções"),
    );
    expect(promotionsLink).toHaveTextContent("$");

    const menuButton = host.querySelector<HTMLButtonElement>('[aria-label="Abrir menu"]');
    act(() => menuButton?.click());
    const rankingLinks = Array.from(
      host.querySelectorAll<HTMLAnchorElement>('a[href="/top"], a[href="/mais-jogados"]'),
    );
    expect(rankingLinks.length).toBeGreaterThan(0);
    rankingLinks.forEach((link) => expect(link.querySelector("svg")).toBeNull());
  });

  it("moves language selection to profile preferences after sign-in", () => {
    renderApp(<Header />);
    expect(findButton("PT")).not.toBeUndefined();

    mockAuthState.user = { id: "signed-in-user" };
    renderApp(<Header />);
    expect(findButton("PT")).toBeUndefined();
  });

  it("shows private tabs only for the profile owner", () => {
    renderApp(
      <Tabs defaultValue="overview">
        <ProfileTabBar owner games={12} platinums={3} reviews={4} hidden={2} friends={8} />
      </Tabs>,
    );

    const ownerTabs = Array.from(host.querySelectorAll('[role="tab"]')).map(
      (tab) => tab.textContent,
    );
    expect(ownerTabs).toContain("Listas");
    expect(ownerTabs).toContain("Ocultos (2)");

    renderApp(
      <Tabs defaultValue="overview">
        <ProfileTabBar games={12} platinums={3} reviews={4} friends={8} />
      </Tabs>,
    );
    const publicTabs = Array.from(host.querySelectorAll('[role="tab"]')).map(
      (tab) => tab.textContent,
    );
    expect(publicTabs).not.toContain("Listas");
    expect(publicTabs.some((label) => label?.startsWith("Ocultos"))).toBe(false);
  });

  it("uses page and compact heading hierarchy without changing game data", () => {
    renderApp(<GameModalHeader game={game} variant="page" />);
    expect(host.querySelector("h1")).toHaveTextContent(game.title);

    renderApp(<GameModalHeader game={game} variant="compact" />);
    expect(host.querySelector("h2")).toHaveTextContent(game.title);
  });

  it("uses clear platform glyphs instead of hardware photos", () => {
    const onChange = vi.fn();
    renderApp(<PlatformChoices value="steam" onChange={onChange} />);

    expect(host.querySelectorAll("img")).toHaveLength(0);
    expect(host.querySelectorAll("svg")).toHaveLength(3);
    expect(findButton("Steam")).toHaveAttribute("aria-pressed", "true");

    act(() => findButton("Xbox")?.click());
    expect(onChange).toHaveBeenCalledWith("xbox");
  });

  it("uses a lazy blurred game image as the background of collection rows", () => {
    const category: CategoryData = {
      id: "story-rich",
      name: "Boa Trama",
      icon: "BookOpen",
      description: "Narrativas profundas e envolventes",
      gradient: "from-background to-card",
    };
    renderApp(
      <CategoryCard
        category={category}
        variant="row"
        previewGames={[{ ...game, backgroundImage: "https://example.com/background.jpg" }]}
      />,
    );

    const background = host.querySelector<HTMLImageElement>('img[src$="background.jpg"]');
    expect(background).toHaveAttribute("alt", "");
    expect(background).toHaveAttribute("loading", "lazy");
    expect(background).toHaveClass("object-cover", "blur-[3px]");
    expect(host.querySelector("a")).toHaveClass("min-h-36");
  });
});
