import { Innertube, Platform, UniversalCache } from "youtubei.js";

import { log } from "@helpers/logger";

Platform.shim.eval = async (data, env) => {
  const properties = [];

  if (env.n) properties.push(`n: exportedVars.nFunction("${env.n}")`);

  if (env.sig) properties.push(`sig: exportedVars.sigFunction("${env.sig}")`);

  const code = `${data.output}\nreturn { ${properties.join(", ")} }`;

  return new Function(code)();
};

const innertubePromise = Innertube.create({
  cache: new UniversalCache(false),
}).then((val) => {
  log({ user: "BOT", type: "YT", message: `YouTube client established.` });
  return val;
});

export const getClient = async () => await innertubePromise;
