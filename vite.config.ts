import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";
import { env } from "process";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env files
  const env = loadEnv(mode, process.cwd(), "");

  const base = env.VITE_BASE ?? "/";
  return {
    base: base.endsWith("/") ? base : base + "/",
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },

      historyApiFallback: {
        rewrites: [{ from: new RegExp("^" + base + ".*$"), to: "/index.html" }],
      },
    },
    plugins: [react(), mcpPlugin(), mode === "development" && componentTagger()].filter(
      Boolean,
    ),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
