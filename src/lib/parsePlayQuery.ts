import { TrackService } from '../classes/Queue.js';
import * as yt from "youtube-search-without-api-key";

export type ParsedQuery = {
  url: string;
  service: TrackService;
  type: "playlist" | "video";
};

function isValidUrl(query: string): URL | null {
  let urlObject;
  try {
    urlObject = new URL(query);
    return urlObject;
  } catch (err) {
    return null;
  }
}

function isValidYoutubeVideoUrl(url: string): boolean {
  const regex =
    /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  return regex.test(url);
}

function isValidYoutubePlaylistUrl(url: string): boolean {
  const regex = /^(?!.*\?.*\bv=)https:\/\/www\.youtube\.com\/.*\?.*\blist=.*$/;
  return regex.test(url);
}

export async function parsePlayQuery(query: string): Promise<ParsedQuery> {
  // return playable URL from play command query
  const queryIsUrl = isValidUrl(query);
  if (!queryIsUrl) {
    // do search
    const searchResults = await yt.search(query);
    if (searchResults && searchResults[0].url) {
      return {
        url: searchResults[0].url,
        service: TrackService.YouTube,
        type: "video",
      };
    } else {
      throw new Error(`No results found for ${query}!`);
    }
  } else {
    // see if it's a valid service url
    const url = queryIsUrl.toString();
    const isSingleVideoUrl = isValidYoutubeVideoUrl(url);
    const isPlaylistUrl = isValidYoutubePlaylistUrl(url);
    if (isSingleVideoUrl) {
      return {
        url,
        service: TrackService.YouTube,
        type: "video",
      };
    } else if (isPlaylistUrl) {
      return {
        url,
        service: TrackService.YouTube,
        type: "playlist",
      };
    } else {
      throw new Error("Unsupported URL");
    }
  }
}
