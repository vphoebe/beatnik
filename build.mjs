import * as esbuild from "esbuild";
import { rimraf } from "rimraf";

const BUILD_DIR = "build";

await rimraf(`${BUILD_DIR}/*`, { glob: true });

await esbuild.build({
  entryPoints: ["src/beatnik.ts", "src/deploy-commands.ts"],
  bundle: true,
  outdir: "build",
  platform: "node",
  format: "cjs",
  treeShaking: true,
  define: {
    "import.meta.url": "_importMetaUrl",
  },
  banner: {
    js: "const _importMetaUrl=require('url').pathToFileURL(__filename)",
  },
  target: "node22",
  outExtension: {
    ".js": ".cjs",
  },
  external: ["jsdom", "canvas"],
});
