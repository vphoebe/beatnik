import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/*.ts", "build.mts"],
  project: ["src/**/*.ts"],
  ignoreDependencies: ["@discordjs/opus", "@prisma/client", "sodium-native"],
};

export default config;
