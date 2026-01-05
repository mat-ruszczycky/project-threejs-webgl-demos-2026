import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import wasm from "vite-plugin-wasm";
import path from "path";

const dirname = import.meta.dirname;

export default defineConfig({
  root: "./src",
  publicDir: "./assets",
  server: {
    host: true,
    open: true,
  },
  build: {
    outDir: path.resolve(dirname, "dist"),
    emptyOutDir: true,
    assetsDir: "assets",
    minify: "esbuild",
    sourcemap: true,
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: path.resolve(dirname, "src/index.html"),
        test: path.resolve(dirname, "src/physics-test-002.html"),
      },
      output: {
        manualChunks: undefined,
      },
    },
  },
  plugins: [
    wasm(),
    glsl({
      compress: true,
    }),
  ],
  // Prevent Vite from trying to prebundle huge libs incorrectly
  optimizeDeps: {
    exclude: ["three"],
  },
});
