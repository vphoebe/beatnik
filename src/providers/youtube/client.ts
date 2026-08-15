import { log } from "@/shared";
import { Innertube, Platform, type Types, UniversalCache } from "youtubei.js";

import { PROVIDER_ID } from ".";

export interface YoutubeClientConfig {
  player_id?: string;
}

export const createInnertubeClient = async (_config: YoutubeClientConfig) => {
  Platform.shim.eval = async (data: Types.BuildScriptResult) => new Function(data.output)();

  return Innertube.create({
    cache: new UniversalCache(true),
  }).then((val) => {
    log({
      component: "PROVIDER",
      name: PROVIDER_ID,
      message: `YouTube client established, player ID: ${val.session.player?.player_id}`,
    });
    return val;
  });
};
