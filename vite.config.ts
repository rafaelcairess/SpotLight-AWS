import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const normalizeSiteOrigin = (value: string) => {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("VITE_SITE_URL must use http or https");
  }
  return url.origin;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteOrigin = normalizeSiteOrigin(env.VITE_SITE_URL || "http://localhost:8080");

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      {
        name: "spotlight-site-metadata",
        transformIndexHtml(html) {
          return html.replaceAll("%SPOTLIGHT_SITE_ORIGIN%", siteOrigin);
        },
      },
    ],
    build: {
      outDir: "dist",
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (id.includes("@supabase")) return "supabase";
            if (id.includes("@tanstack")) return "query";
            if (id.includes("i18next")) return "i18n";
            if (
              id.includes("react-router") ||
              id.includes("react-dom") ||
              /node_modules[\\/]react[\\/]/.test(id)
            ) {
              return "react";
            }
            return undefined;
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
