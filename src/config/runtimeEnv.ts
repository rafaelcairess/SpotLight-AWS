type SpotlightRuntimeEnv = {
  VITE_API_URL?: string;
  VITE_SITE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
};

// Supabase publishable keys are intentionally safe to ship to the browser.
const DEFAULT_SUPABASE_URL = "https://bqdrlvxijhlxtioikwhh.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qDvRoZO_AxS3fH-ASDnYkA_DlGr19hP";

const runtimeEnv: SpotlightRuntimeEnv = import.meta.env;

const browserOrigin = typeof window === "undefined" ? "" : window.location.origin;

const normalizeSiteOrigin = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : browserOrigin;
  } catch {
    return browserOrigin;
  }
};

export const SITE_URL = normalizeSiteOrigin(runtimeEnv.VITE_SITE_URL || browserOrigin);

export const SUPABASE_URL = runtimeEnv.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;

export const SUPABASE_PUBLISHABLE_KEY =
  runtimeEnv.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export const API_URL = (runtimeEnv.VITE_API_URL || "").replace(/\/$/, "");
