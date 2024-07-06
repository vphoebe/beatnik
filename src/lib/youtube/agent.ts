import ytdl from "@distube/ytdl-core";
import { getCookiesArray } from "../environment.js";

export const agent = ytdl.createAgent(getCookiesArray());
