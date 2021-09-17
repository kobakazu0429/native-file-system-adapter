import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
    lib: {
      entry: "src/index.ts",
      name: "native-file-system-adapter-lite",
    },
    rollupOptions: {
      external: ["fs", "path"],
      output: {
        globals: {
          fs: "fs",
          path: "path",
        },
      },
    },
  },
});
