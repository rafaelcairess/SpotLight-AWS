import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Supabase returns recovery tokens to `/`, which CloudFront can always serve.
 * Once the client has consumed the token, navigation to `/auth` stays inside
 * the SPA and therefore does not require an origin rewrite.
 */
export function AuthReturnHandler() {
  const { loading, session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const mode = new URLSearchParams(location.search).get("auth_mode");
    if (mode !== "reset" || loading) return;

    navigate(session ? "/auth?mode=reset" : "/auth?mode=login", { replace: true });
  }, [loading, location.search, navigate, session]);

  return null;
}
