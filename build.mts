import { build, BuildOptions } from "esbuild";
import { rimraf } from "rimraf";

const BUILD_DIR = "build";

await rimraf(`${BUILD_DIR}/*`, { glob: true });

const entryPoints = ["src/beatnik.ts", "src/deploy-commands.ts"];

console.log(`> Building ${entryPoints.join(", ")} into ${BUILD_DIR}/`);

const config: BuildOptions = {
  entryPoints,
  bundle: true,
  packages: "external",
  minify: true,
  outdir: "build",
  platform: "node",
  target: ["node22"],
  format: "esm",
  treeShaking: true,
  splitting: true,
  outExtension: {
    ".js": ".mjs",
  },
};

await build(config);

console.log("> Build complete");
