import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ONBOARDING_COMPLETED_EVENT, STORAGE_KEYS } from "@/config/storageKeys";

const WHATS_NEW_VERSION = "2026.11";
const CHANGELOG_KEYS = ["interface", "collections", "profile", "library", "stability"] as const;

export default function WhatsNewModal() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const hasOpened = useRef(false);

  useEffect(() => {
    if (loading || typeof window === "undefined") return;

    const onboardingKey = `${STORAGE_KEYS.onboarding}.${user?.id ?? "guest"}`;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const hasSeenCurrentVersion = () => {
      try {
        return window.localStorage.getItem(STORAGE_KEYS.whatsNewSeenVersion) === WHATS_NEW_VERSION;
      } catch {
        return hasOpened.current;
      }
    };

    const scheduleOpen = () => {
      if (hasOpened.current || timer || hasSeenCurrentVersion()) return;
      timer = setTimeout(() => {
        hasOpened.current = true;
        setOpen(true);
      }, 600);
    };

    try {
      if (window.localStorage.getItem(onboardingKey) === "done") scheduleOpen();
    } catch {
      // If storage is blocked, the onboarding event can still open the notes once per session.
    }
    window.addEventListener(ONBOARDING_COMPLETED_EVENT, scheduleOpen);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener(ONBOARDING_COMPLETED_EVENT, scheduleOpen);
    };
  }, [loading, user?.id]);

  const handleClose = () => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.whatsNewSeenVersion, WHATS_NEW_VERSION);
    } catch {
      // Closing the dialog still works when storage is unavailable.
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] max-w-2xl overflow-y-auto sm:max-h-[85vh]">
        <DialogHeader className="space-y-3 border-b border-border pb-5">
          <p className="eyebrow">{t("whatsNew.eyebrow")}</p>
          <DialogTitle className="max-w-xl text-2xl leading-tight tracking-[-0.03em] sm:text-3xl">
            {t("whatsNew.title")}
          </DialogTitle>
          <DialogDescription className="max-w-xl text-sm leading-6">
            {t("whatsNew.description")}
          </DialogDescription>
        </DialogHeader>

        <ol className="divide-y divide-border">
          {CHANGELOG_KEYS.map((key, index) => (
            <li key={key} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-4 sm:gap-4">
              <span className="pt-0.5 font-logo text-xs font-semibold tabular-nums text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-sm font-semibold">{t(`whatsNew.items.${key}.title`)}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t(`whatsNew.items.${key}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <section className="border-t border-border pt-5">
          <h3 className="text-sm font-semibold">{t("whatsNew.aboutTitle")}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("whatsNew.aboutDescription")}
          </p>
        </section>

        <div className="flex justify-end pt-2">
          <Button onClick={handleClose} className="w-full sm:w-auto sm:min-w-32">
            {t("whatsNew.continue")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
