import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works from any sub-path, such as GitHub Pages.
  base: "./",
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"]
  }
});
