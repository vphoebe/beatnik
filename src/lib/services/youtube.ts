import { QueuedTrack } from "../../classes/Queue";
import { ParsedQuery } from "../parsePlayQuery";
import { createAudioResource, StreamType } from "@discordjs/voice";
import ytdl from "ytdl-core";
import ytdlPlayer from "ytdl-core-discord";
import ytpl from "ytpl";

export async function parsedQueryToYoutubeQueuedTracks(
  query: ParsedQuery,
  addedBy: string
): Promise<QueuedTrack[]> {
  const { url, service, type } = query;
  if (type === "video") {
    const info = await ytdl.getInfo(url);
    const { videoDetails } = info;
    const { title, lengthSeconds, thumbnails, author } = videoDetails;
    const track = {
      title,
      length: parseInt(lengthSeconds),
      url,
      service,
      channel: author.name,
      thumbnailImageUrl: thumbnails[0].url,
      addedBy,
    };
    return [track];
  } else if (type === "playlist") {
    const playlist = await ytpl(url, { limit: 9999, pages: 9999 });
    return playlist.items.map((item) => ({
      title: item.title,
      length: item.durationSec ?? 0,
      url: item.shortUrl,
      service,
      channel: item.author.name,
      thumbnailImageUrl: item.bestThumbnail.url ?? undefined,
      addedBy,
    }));
  } else {
    throw new Error("invalidQuery");
  }
}

export async function createYoutubeTrackResource(track: QueuedTrack) {
  return createAudioResource(await ytdlPlayer(track.url), {
    inputType: StreamType.Opus,
    metadata: {
      title: track.title,
    },
  });
}
