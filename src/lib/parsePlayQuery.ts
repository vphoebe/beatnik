import { TrackService } from "../classes/Queue.js";
import ytsr from "@distube/ytsr";
import ytpl from "@distube/ytpl";
import ytdl from "@distube/ytdl-core";

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

export async function parsePlayQuery(query: string): Promise<ParsedQuery> {
  // return playable URL from play command query
  const urlObject = isValidUrl(query);
  if (!urlObject) {
    // do search
    const searchResults = await ytsr(query, { limit: 1 });
    if (searchResults && searchResults.results > 0) {
      return {
        url: searchResults.items[0].url,
        service: TrackService.YouTube,
        type: "video",
      };
    } else {
      throw new Error(`No results found for ${query}!`);
    }
  } else {
    // see if it's a valid service url
    const url = urlObject.toString();
    if (url.includes("playlist") && ytpl.validateID(url)) {
      // add .includes() check to prevent single videos from queuing a playlist
      return {
        url,
        service: TrackService.YouTube,
        type: "playlist",
      };
    } else if (ytdl.validateURL(url)) {
      return {
        url,
        service: TrackService.YouTube,
        type: "video",
      };
    } else {
      throw new Error(`Unsupported URL: ${url}`);
    }
  }
}
