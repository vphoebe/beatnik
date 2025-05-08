import ytdl from "@distube/ytdl-core";
import ytpl from "@distube/ytpl";
import { YT } from "youtubei.js";

export const getURLFromYtID = (id: string) => {
  return `https://youtube.com/watch?v=${id}`;
};

export const getURLFromPlID = (id: string) => {
  return `https://youtube.com/playlist?list=${id}`;
};

export const getYtIDFromURL = async (
  url: string,
): Promise<{ id: string; type: "track" | "playlist" }> => {
  const urlObject = new URL(url);
  const validUrl = urlObject.toString();
  if (validUrl.includes("playlist") && ytpl.validateID(validUrl)) {
    return {
      id: await ytpl.getPlaylistID(validUrl),
      type: "playlist",
    };
  } else if (ytdl.validateURL(validUrl)) {
    return {
      id: ytdl.getVideoID(validUrl),
      type: "track",
    };
  } else {
    throw new Error("Non-YouTube URL");
  }
};

export const getLoudnessFromInfo = (info: YT.VideoInfo) => {
  const { streaming_data } = info;
  return streaming_data?.formats.find((f) => f.loudness_db !== undefined)?.loudness_db ?? 0;
};
