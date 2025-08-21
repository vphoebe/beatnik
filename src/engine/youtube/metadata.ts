import { YTNodes } from "youtubei.js";

import { getClient } from "./client";
import { extractYTIdFromURL, getLoudnessFromInfo, playlistIdToURL, trackIdToURL } from "./util";

import { getSavedPlaylistById } from "@engine/db/playlist";
import { getTrackByYtId } from "@engine/db/track";

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
    const idObject = await extractYTIdFromURL(query);
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
    const yt = await getClient();
    const info = await yt.getBasicInfo(id);
    const { basic_info } = info;
    return {
      title: basic_info.title ?? "Unknown",
      url: trackIdToURL(basic_info.id ?? ""),
      length: basic_info.duration ?? 0,
      id: basic_info.id ?? "Unknown",
      channelName: basic_info.author ?? basic_info.channel?.name ?? "Unknown",
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

  const totalItems: YTNodes.PlaylistVideo[] = [];

  const yt = await getClient();
  let playlistInfo = await yt.getPlaylist(id);
  totalItems.push(...playlistInfo.items.filterType(YTNodes.PlaylistVideo));
  while (playlistInfo.has_continuation) {
    playlistInfo = await playlistInfo.getContinuation();
    totalItems.push(...playlistInfo.items.filterType(YTNodes.PlaylistVideo));
  }

  const tracksWithoutLoudness: Omit<YtApiTrack, "loudness">[] = totalItems.map((item, index) => {
    return {
      id: item.id,
      title: item.title.text ?? "Unknown",
      length: item.duration.seconds,
      channelName: item.author.name,
      thumbnailUrl: item.thumbnails?.[0].url,
      playlistIdx: index,
      url: trackIdToURL(item.id),
    };
  });

  const tracks: YtApiTrack[] = await Promise.all(
    tracksWithoutLoudness.map(async (track) => {
      const matchedTrack = await getTrackByYtId(track.id);
      if (matchedTrack) {
        return { ...track, loudness: matchedTrack.loudness };
      }

      try {
        const info = await yt.getBasicInfo(track.id);
        return { ...track, loudness: getLoudnessFromInfo(info) };
      } catch {
        return { ...track, loudness: 0 };
      }
    }),
  );

  return {
    tracks,
    title: playlistInfo.info.title ?? "Unknown",
    url: playlistIdToURL(id),
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
      const yt = await getClient();
      const search = await yt.search(parsedQuery.query);
      const videoId = search.videos[0].as(YTNodes.Video).video_id;
      if (!videoId) {
        throw new Error("No search results found.");
      }
      return {
        track: await getTrackInfo(videoId, useLibrary),
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
