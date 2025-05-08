import { YT } from "youtubei.js";

import { yt } from "./client.js";

export const getURLFromYtID = (id: string) => {
  return `https://youtube.com/watch?v=${id}`;
};

export const getURLFromPlID = (id: string) => {
  return `https://youtube.com/playlist?list=${id.replace("VL", "")}`;
};

export const getYtIDFromURL = async (
  url: string,
): Promise<{ id: string; type: "track" | "playlist" }> => {
  const urlObject = new URL(url);
  const validUrl = urlObject.toString();
  const endpoint = await yt.resolveURL(validUrl);
  if (endpoint.payload.browseId) {
    return {
      id: endpoint.payload.browseId,
      type: "playlist",
    };
  } else if (endpoint.payload.videoId) {
    return {
      id: endpoint.payload.videoId,
      type: "track",
    };
  } else if (endpoint.payload.url) {
    // youtu.be link
    return getYtIDFromURL(endpoint.payload.url);
  } else {
    throw new Error("Non-YouTube URL");
  }
};

export const getLoudnessFromInfo = (info: YT.VideoInfo) => {
  const { streaming_data } = info;
  return streaming_data?.formats.find((f) => f.loudness_db !== undefined)?.loudness_db ?? 0;
};
