import { Innertube, Platform, UniversalCache } from "youtubei.js";

import { getPlayerIdOverride } from "@helpers/environment";
import { log } from "@helpers/logger";

const KNOWN_WORKING_PID = "487b9fc1";

const getPlayerId = () => {
  const envOverride = getPlayerIdOverride();

  return envOverride ?? KNOWN_WORKING_PID;
};

Platform.shim.eval = async (data, env) => {
  const properties = [];
  if (env.n) properties.push(`n: exportedVars.nFunction("${env.n}")`);
  if (env.sig) properties.push(`sig: exportedVars.sigFunction("${env.sig}")`);
  const code = `${data.output}\nreturn { ${properties.join(", ")} }`;

  return new Function(code)();
};

const innertubePromise = Innertube.create({
  cache: new UniversalCache(false),
  player_id: getPlayerId(),
}).then((val) => {
  log({
    user: "BOT",
    type: "YT",
    message: `YouTube client established, player ID: ${val.session.player?.player_id}`,
  });
  return val;
});

export const getClient = async () => await innertubePromise;
