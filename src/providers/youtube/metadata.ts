import { YTNodes } from "youtubei.js";
import type { Innertube } from "youtubei.js";

import { PROVIDER_ID } from ".";
import type { ProviderPlaylist, ProviderTrack, ResolvedQuery } from "../provider";
import { extractYTIdFromURL, getLoudnessFromInfo, playlistIdToURL, trackIdToURL } from "./util";

export async function resolve(yt: Innertube, query: string): Promise<ResolvedQuery | null> {
  try {
    const idObject = await extractYTIdFromURL(yt, query);
    return {
      resolvedQuery: idObject.id,
      type: idObject.type,
    };
  } catch (err) {
    if (err instanceof TypeError) {
      // URL constructor error, just return as a search query
      return {
        resolvedQuery: query,
        type: "search",
      };
    } else {
      // URL, but not a valid youtube one
      throw new Error("Invalid YouTube URL");
    }
  }
}

export async function getTrackInfo(
  yt: Innertube,
  id: string,
  playlistIdx?: number,
): Promise<ProviderTrack | null> {
  try {
    const info = await yt.getBasicInfo(id);
    const { basic_info } = info;
    return {
      providerId: PROVIDER_ID,
      title: basic_info.title ?? "Unknown",
      url: trackIdToURL(basic_info.id ?? ""),
      length: basic_info.duration ?? 0,
      id: basic_info.id ?? "Unknown",
      channelName: basic_info.author ?? basic_info.channel?.name ?? "Unknown",
      thumbnailUrl: basic_info.thumbnail?.[0].url ?? "Unknown",
      loudness: getLoudnessFromInfo(info),
      playlistIdx: playlistIdx !== undefined ? playlistIdx : null,
    };
  } catch (err) {
    console.error(`Error for ${id}`);
    console.error(err);
    return null;
  }
}

function isPlaylistVideo(
  item: YTNodes.PlaylistVideo | YTNodes.LockupView,
): item is YTNodes.PlaylistVideo {
  return item.type === "PlaylistVideo";
}

export async function getPlaylistInfo(yt: Innertube, id: string): Promise<ProviderPlaylist | null> {
  const totalItems: (YTNodes.PlaylistVideo | YTNodes.LockupView)[] = [];

  try {
    let playlistInfo = await yt.getPlaylist(id);
    totalItems.push(...playlistInfo.items.filterType(YTNodes.LockupView, YTNodes.PlaylistVideo));
    while (playlistInfo.has_continuation) {
      playlistInfo = await playlistInfo.getContinuation();
      totalItems.push(...playlistInfo.items.filterType(YTNodes.LockupView, YTNodes.PlaylistVideo));
    }

    const getTracks: () => Promise<ProviderTrack[]> = () =>
      Promise.all(
        totalItems.map(async (item, index) => {
          if (isPlaylistVideo(item)) {
            return {
              providerId: PROVIDER_ID,
              id: item.id,
              title: item.title.text ?? "Unknown",
              length: item.duration.seconds,
              channelName: item.author.name,
              thumbnailUrl: item.thumbnails?.[0].url,
              playlistIdx: index,
              url: trackIdToURL(item.id),
              // loudness not available from getPlaylist, would require individual calls
              // return null, will be resolved at playback-time by corePlayer and resolver
              // via calling getTrack on this provider (which returns loudness)
              loudness: null,
            };
          } else {
            // item.type = LockupView
            // which doesn't contain enough metadata directly.
            // have to call getTrackInfo, will include loudness too.
            return getTrackInfo(yt, item.content_id, index);
          }
        }),
      ).then((tracks) => tracks.filter((t): t is ProviderTrack => t !== null));

    return {
      providerId: PROVIDER_ID,
      tracks: await getTracks(),
      title: playlistInfo.info.title ?? "Unknown",
      url: playlistIdToURL(id),
      id,
      authorName: playlistInfo.info.author.name,
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function search(yt: Innertube, query: string): Promise<ProviderTrack | null> {
  const search = await yt.search(query);
  const videoId = search.videos[0].as(YTNodes.Video).video_id;
  if (!videoId) {
    throw new Error("No search results found.");
  }
  return await getTrackInfo(yt, videoId);
}
