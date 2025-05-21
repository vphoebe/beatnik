import * as esbuild from "esbuild";

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
