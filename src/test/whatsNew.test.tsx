import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import { STORAGE_KEYS } from "@/config/storageKeys";
import WhatsNewModal from "@/features/onboarding/components/WhatsNewModal";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

let host: HTMLDivElement;
let root: Root | undefined;

function renderModal() {
  act(() => {
    root?.render(
      <I18nextProvider i18n={i18n}>
        <WhatsNewModal />
      </I18nextProvider>,
    );
  });
}

describe("WhatsNewModal", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    const values = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        get length() {
          return values.size;
        },
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        key: (index: number) => [...values.keys()][index] ?? null,
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value),
      } satisfies Storage,
    });
    window.localStorage.clear();
    window.localStorage.setItem(`${STORAGE_KEYS.onboarding}.guest`, "done");
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await i18n.changeLanguage("pt");
  });

  afterEach(() => {
    if (root) act(() => root?.unmount());
    root = undefined;
    host.remove();
    vi.useRealTimers();
  });

  it("opens once per version and stays closed after continuing", () => {
    renderModal();
    act(() => vi.advanceTimersByTime(600));

    expect(document.body).toHaveTextContent("O SpotLight está mais simples e conectado");
    const continueButton = Array.from(document.body.querySelectorAll("button")).find(
      (button) => button.textContent === "Continuar",
    );
    act(() => continueButton?.click());
    expect(window.localStorage.getItem(STORAGE_KEYS.whatsNewSeenVersion)).toBe("2026.11");
    expect(document.body).not.toHaveTextContent("O SpotLight está mais simples e conectado");

    act(() => root?.unmount());
    root = createRoot(host);
    renderModal();
    act(() => vi.advanceTimersByTime(600));
    expect(document.body).not.toHaveTextContent("O SpotLight está mais simples e conectado");
  });
});
