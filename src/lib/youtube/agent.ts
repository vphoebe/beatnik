import ytdl from "@distube/ytdl-core";

import { getCookiesArray } from "../environment.js";

const cookies = getCookiesArray();
export const agent = ytdl.createAgent(cookies);
