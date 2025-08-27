import { defineConfig } from "tsdown";

const BUILD_DIR = "build";
const ENTRYPOINTS = ["src/beatnik.ts", "src/deploy-commands.ts"];

export default defineConfig({
  entry: ENTRYPOINTS,
  outDir: BUILD_DIR,
  platform: "node",
  target: "node22",
  format: "esm",
  minify: true,
  exports: true,
  fixedExtension: true,
});
