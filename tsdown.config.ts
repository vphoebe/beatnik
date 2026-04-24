import replace from "@rollup/plugin-replace";
import { defineConfig } from "tsdown";

const BUILD_DIR = "dist";

export default defineConfig({
  entry: "src/index.ts",
  outDir: BUILD_DIR,
  platform: "node",
  target: "node22",
  format: "esm",
  minify: true,
  exports: true,
  fixedExtension: true,
  plugins: [
    replace({
      "config.useMockProvider": JSON.stringify(false),
      preventAssignment: true,
    }),
  ],
});
