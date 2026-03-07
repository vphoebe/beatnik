import { Innertube, UniversalCache } from "youtubei.js";

import { log } from "@helpers/logger";

// https://github.com/LuanRT/YouTube.js/issues/1146#issuecomment-4006959046
const KNOWN_PIDS = [
  "140dafda",
  "4eecba16",
  "00c52fa0",
  "251ca12e",
  "267b6435",
  "32a343c8",
  "48995d17",
  "4c5cf06a",
  "9f4cc5e4",
  "a944b11f",
];

const getPlayerId = () => KNOWN_PIDS[Math.floor(Math.random() * KNOWN_PIDS.length)];

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
