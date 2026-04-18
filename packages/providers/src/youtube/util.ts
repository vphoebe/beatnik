import type { Innertube, YT } from "youtubei.js";

export function trackIdToURL(id: string) {
  return `https://youtube.com/watch?v=${id}`;
}

export function playlistIdToURL(id: string) {
  // have to remove VL from the ID for the url to work
  return `https://youtube.com/playlist?list=${id.replace("VL", "")}`;
}

export async function extractYTIdFromURL(
  yt: Innertube,
  url: string,
): Promise<{ id: string; type: "track" | "playlist" }> {
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
    return extractYTIdFromURL(yt, endpoint.payload.url);
  } else {
    throw new Error("Non-YouTube URL");
  }
}

export function getLoudnessFromInfo(info: YT.VideoInfo) {
  const { player_config } = info;
  return player_config?.audio_config.loudness_db ?? null;
}
