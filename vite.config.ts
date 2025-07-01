import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Determine if we're in Replit
const isReplit = process.env.REPL_ID !== undefined && process.env.NODE_ENV !== "production";

export default defineConfig(async () => {
  const plugins = [react()];

  // Only import Replit plugins dynamically if in Replit
  if (isReplit) {
    try {
      const { default: runtimeErrorOverlay } = await import("@replit/vite-plugin-runtime-error-modal");
      const { cartographer } = await import("@replit/vite-plugin-cartographer");
      plugins.push(runtimeErrorOverlay(), cartographer());
    } catch (err) {
      console.warn("⚠️ Replit plugins could not be loaded. Skipping them.");
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
