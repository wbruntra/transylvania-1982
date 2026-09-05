import { defineConfig } from "vite";

export default defineConfig({
  // public/ holds the generated game.json and the scene art; both are copied
  // verbatim into the build. game.json is written by tools/sync-data.mjs -- it
  // is generated, not source.
  publicDir: "public",
  server: { port: 8099, strictPort: true },
});
