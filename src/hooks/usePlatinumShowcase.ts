import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlatinumShowcaseOptions {
  includePrivate?: boolean;
  enabled?: boolean;
}

export function usePlatinumShowcase(
  userId?: string,
  { includePrivate = true, enabled = true }: PlatinumShowcaseOptions = {},
) {
  return useQuery({
    queryKey: ["profile-platinum-showcase", userId, includePrivate],
    queryFn: async () => {
      if (!userId) return [];
      let query = supabase
        .from("user_games")
        .select("id, app_id, hours_played, hours_played_manual, hours_override, platinum_platforms")
        .eq("user_id", userId)
        .eq("is_platinumed", true)
        .eq("is_hidden", false);
      if (!includePrivate) query = query.eq("is_private", false);
      const { data, error } = await query.order("updated_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data.map((game) => ({
        ...game,
        hours_played:
          game.hours_override && typeof game.hours_played_manual === "number"
            ? game.hours_played_manual
            : game.hours_played,
      }));
    },
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
