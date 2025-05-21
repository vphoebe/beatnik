import * as esbuild from "esbuild";
import { rimraf } from "rimraf";

const BUILD_DIR = "build";

await rimraf(`${BUILD_DIR}/*`, { glob: true });

await esbuild.build({
  entryPoints: ["src/beatnik.ts", "src/deploy-commands.ts"],
  bundle: true,
  minify: true,
  outdir: "build",
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "external",
  outExtension: {
    ".js": ".mjs",
  },
});
