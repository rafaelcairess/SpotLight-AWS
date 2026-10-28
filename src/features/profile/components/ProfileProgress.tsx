import { useProfileProgress } from "@/hooks/useProfileProgress";

export function ProfileProgressCard({ userId }: { userId?: string }) {
  const { data } = useProfileProgress(userId);
  if (!data) return null;
  return (
    <div
      className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 py-1 pl-1 pr-3"
      title={`${data.xp.toLocaleString("pt-BR")} XP`}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {data.level}
      </span>
      <span className="text-sm font-medium">Nível {data.level}</span>
    </div>
  );
}
