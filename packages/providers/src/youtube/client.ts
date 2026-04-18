import { log } from "@beatnik/shared";
import { Innertube, Platform, UniversalCache } from "youtubei.js";

const KNOWN_WORKING_PID = "487b9fc1";

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
    player_id: config.player_id || KNOWN_WORKING_PID,
  }).then((val) => {
    log({
      user: "BOT",
      type: "YT",
      message: `YouTube client established, player ID: ${val.session.player?.player_id}`,
    });
    return val;
  });
};
