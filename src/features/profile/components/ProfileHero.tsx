import type { ReactNode } from "react";
import { UserAvatar } from "@/features/profile/components/UserAvatar";

interface ProfileHeroProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  username?: string | null;
  bio?: string | null;
  fallbackName: string;
  presence: ReactNode;
  actions: ReactNode;
  stats?: Array<{ label: string; value: number }>;
}

/** Shared profile introduction for owner and public profiles. */
export function ProfileHero({
  avatarUrl,
  displayName,
  username,
  bio,
  fallbackName,
  presence,
  actions,
  stats = [],
}: ProfileHeroProps) {
  return (
    <div className="overflow-hidden border-b border-border bg-card">
      <div className="grid gap-5 p-4 sm:p-7 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-6 lg:p-9">
        <UserAvatar
          src={avatarUrl}
          displayName={displayName}
          username={username}
          size="xl"
          shape="square"
          className="h-28 w-28 justify-self-center rounded-xl border border-border sm:h-36 sm:w-36 md:h-40 md:w-40 md:justify-self-start"
        />

        <div className="flex min-w-0 flex-col justify-end gap-5">
          <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
            <div className="min-w-0 max-w-full">
              <h1 className="truncate font-logo text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl md:text-4xl md:tracking-[-0.05em]">
                {displayName || fallbackName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start sm:gap-3">
                <p className="text-sm text-muted-foreground">@{username}</p>
                {presence}
              </div>
              {bio && <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/75">{bio}</p>}
            </div>
            <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-2 sm:w-auto sm:flex-col sm:items-end sm:gap-3">
              {actions}
            </div>
          </div>

          {!!stats.length && (
            <dl className="grid w-full max-w-2xl grid-cols-3 divide-x divide-border border-y border-border">
              {stats.map((stat) => (
                <div key={stat.label} className="min-w-0 px-3 py-3 text-center sm:text-left">
                  <dt className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </dt>
                  <dd className="mt-0.5 font-logo text-lg font-bold sm:text-xl">{stat.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
