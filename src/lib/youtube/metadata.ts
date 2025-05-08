import { YTNodes } from "youtubei.js";

import { getSavedPlaylistById } from "../library/db/playlist.js";
import { getAllTracks, getTrackByYtId } from "../library/db/track.js";
import { yt } from "./innertube.js";
import { getLoudnessFromInfo, getURLFromPlID, getURLFromYtID, getYtIDFromURL } from "./util.js";

interface Query {
  query: string;
  type: "playlist" | "track" | "query";
}

export interface YtApiTrack {
  id: string;
  url: string;
  title: string;
  thumbnailUrl: string;
  channelName: string;
  length: number;
  loudness: number;
  playlistIdx: number | null;
}

export interface YtApiPlaylist {
  id: string;
  url: string;
  title: string;
  authorName: string;
  tracks: YtApiTrack[];
}

async function getQueryType(query: string): Promise<Query | null> {
  try {
    const idObject = await getYtIDFromURL(query);
    return {
      query: idObject.id,
      type: idObject.type,
    };
  } catch (err) {
    if (err instanceof TypeError) {
      // URL constructor error, just return as a search query
      return {
        query,
        type: "query",
      };
    } else {
      // URL, but not a valid youtube one
      throw new Error("Invalid YouTube URL");
    }
  }
}

async function getTrackInfo(id: string, useLibrary: boolean): Promise<YtApiTrack | undefined> {
  const existingTrack = await getTrackByYtId(id);
  if (existingTrack && useLibrary) {
    return existingTrack;
  }
  try {
    const info = await yt.getBasicInfo(id, "WEB");
    const { basic_info } = info;
    return {
      title: basic_info.title ?? "Unknown",
      url: getURLFromYtID(basic_info.id ?? ""),
      length: basic_info.duration ?? 0,
      id: basic_info.id ?? "Unknown",
      channelName: basic_info.channel?.name ?? "Unknown",
      thumbnailUrl: basic_info.thumbnail?.[0].url ?? "Unknown",
      loudness: getLoudnessFromInfo(info),
      playlistIdx: null,
    };
  } catch (err) {
    console.error(`Error for ${id}`);
    console.error(err);
  }
}

async function getPlaylistInfo(id: string, useLibrary: boolean): Promise<YtApiPlaylist> {
  const existingPlaylist = await getSavedPlaylistById(id);
  if (existingPlaylist && useLibrary) {
    return existingPlaylist;
  }

  const playlistInfo = await yt.getPlaylist(id);
  const intermediateTracks: YtApiTrack[] = playlistInfo.items
    .filterType(YTNodes.PlaylistVideo)
    .map((item, index) => {
      return {
        id: item.id,
        title: item.title.text ?? "Unknown",
        length: item.duration.seconds,
        channelName: item.author.name,
        thumbnailUrl: item.thumbnails?.[0].url,
        playlistIdx: index,
        url: getURLFromYtID(item.id),
        loudness: 0,
      };
    });

  // patch in loudness from db or API
  const existingLoudnessData = (await getAllTracks()).map((t) => ({
    id: t.id,
    loudness: t.loudness,
  }));

  const tracks: YtApiTrack[] = [];

  for (const track of intermediateTracks) {
    const match = existingLoudnessData.find((t) => t.id === track.id);
    if (match) {
      tracks.push({ ...track, loudness: match.loudness });
    } else {
      const info = await yt.getBasicInfo(track.id);
      tracks.push({
        ...track,
        loudness: getLoudnessFromInfo(info),
      });
    }
  }

  return {
    tracks,
    title: playlistInfo.info.title ?? "Unknown",
    url: getURLFromPlID(id),
    id,
    authorName: playlistInfo.info.author.name,
  };
}

export async function getMetadataFromQuery(query: string, options: { useLibrary: boolean }) {
  const { useLibrary } = options;
  const parsedQuery = await getQueryType(query);

  if (!parsedQuery) {
    return undefined;
  }

  switch (parsedQuery.type) {
    case "track": {
      return {
        track: await getTrackInfo(parsedQuery.query, useLibrary),
        type: "track ",
      };
    }
    case "query": {
      const searchResults = await yt.search(parsedQuery.query);
      const result = searchResults.results.firstOfType(YTNodes.Video);
      if (!result) {
        throw new Error("No search results found.");
      }
      return {
        track: await getTrackInfo(result.video_id, useLibrary),
        type: "track",
      };
    }
    case "playlist": {
      return {
        playlist: await getPlaylistInfo(parsedQuery.query, useLibrary),
        type: "playlist",
      };
    }
  }
}
