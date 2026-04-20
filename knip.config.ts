import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/*.ts"],
  project: ["src/**/*.ts"],
  ignoreDependencies: [
    "@discordjs/opus",
    "@snazzah/davey",
    "ffmpeg-static",
    "bufferutil",
    "zlib-sync",
  ],
};

export default config;
