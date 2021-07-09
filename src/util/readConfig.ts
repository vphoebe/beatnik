import fs from "fs";
import path from "path";
import { Shortcut } from "../types";

const configFile = fs.readFileSync(path.resolve(__dirname, "../../config.json"), "utf-8");

export type Config = {
  prefix: string;
  discord_token: string;
  youtube_token: string;
  default_volume: number;
  shortcuts?: Shortcut[];
  error?: string;
};

const emptyConfig: Config = {
  prefix: "",
  discord_token: "",
  youtube_token: "",
  default_volume: 0,
};

const readConfig = (): Config => {
  if (!configFile) return { error: "Config file not found.", ...emptyConfig };
  const configObject = JSON.parse(configFile);
  if (!configObject.prefix) return { error: "Prefix not found in configuration.", ...emptyConfig };
  if (!configObject.discord_token)
    return {
      error: "Discord token not found in configuration.",
      ...emptyConfig,
    };
  if (!configObject.youtube_token)
    return {
      error: "YouTube token not found in configuration.",
      ...emptyConfig,
    };
  if (!configObject.default_volume)
    return {
      error: "Default volume not found in configuration.",
      ...emptyConfig,
    };
  console.log("Config file detected with all fields.");
  return configObject;
};

export default readConfig();
