import { log } from "@/shared";
import { Innertube, Platform, UniversalCache } from "youtubei.js";

import { PROVIDER_ID } from ".";

export interface YoutubeClientConfig {
  player_id?: string;
}

export const createInnertubeClient = async (config: YoutubeClientConfig) => {
  Platform.shim.eval = async (data, env) => {
    const properties = [];
    if (env.n) properties.push(`n: exportedVars.nFunction("${env.n}")`);
    if (env.sig) properties.push(`sig: exportedVars.sigFunction("${env.sig}")`);
    const code = `${data.output}\nreturn { ${properties.join(", ")} }`;

    return new Function(code)();
  };

  return Innertube.create({
    cache: new UniversalCache(false),
    player_id: config.player_id,
  }).then((val) => {
    log({
      component: "PROVIDER",
      name: PROVIDER_ID,
      message: `YouTube client established, player ID: ${val.session.player?.player_id}`,
    });
    return val;
  });
};
