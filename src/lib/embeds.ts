import { QueuedTrack } from "../classes/Queue";
import { SavedUrl } from "./db";
import { parsePlayQuery } from "./parsePlayQuery";
import { parsedQueryToMetadata } from "./services/youtube";
import { getDurationString } from "./util";
import {
  bold,
  hyperlink,
  inlineCode,
  italic,
  userMention,
} from "@discordjs/builders";
import { MessageEmbed } from "discord.js";

const baseEmbed = () =>
  new MessageEmbed()
    .setColor("ORANGE")
    .setTimestamp()
    .setFooter({ text: "sent by Beatnik" });

export function getNowPlayingEmbed(
  track: QueuedTrack,
  currentIndex: number,
  totalQueued: number
) {
  return baseEmbed()
    .setAuthor({
      name: `Now playing on Beatnik (track ${currentIndex} of ${totalQueued})`,
    })
    .setTitle(track.title)
    .setThumbnail(track.thumbnailImageUrl ?? "")
    .setDescription(
      `:cinema: ${italic(
        track.channel ?? "unknown"
      )}  :hourglass: ${getDurationString(
        track.length
      )} :technologist: ${userMention(track.addedBy)}`
    )
    .setURL(track.url);
}

export function getQueueListEmbed(
  tracks: QueuedTrack[],
  pageNumber: number,
  totalPages: number,
  currentIndex: number
) {
  const trackStrings = tracks.map((t, relativeIndex) => {
    const indexOffset = 1 + 10 * (pageNumber - 1);
    const shortTitle =
      t.title.length > 50 ? `${t.title.substring(0, 45)}...` : t.title;
    const absoluteIndex = relativeIndex + indexOffset;
    const isNowPlaying = currentIndex + 1 === absoluteIndex;
    return `${isNowPlaying ? ":sound: " : ""}[${absoluteIndex}]: ${
      isNowPlaying ? bold(shortTitle) : shortTitle
    }
      :cinema: ${italic(
        t.channel ?? "unknown author"
      )}  :hourglass: ${getDurationString(t.length)}`;
  });
  const fieldText =
    trackStrings.length > 0
      ? trackStrings.join("\n\n")
      : "Nothing is after this track.";
  return baseEmbed()
    .setAuthor({ name: "Current queue for Beatnik" })
    .addField(`(Page ${pageNumber} of ${totalPages})`, fieldText);
}

export async function getSavedUrlListEmbed(savedUrls: SavedUrl[]) {
  const queryPromises = savedUrls.map((su) => parsePlayQuery(su.url));
  const queries = await Promise.all(queryPromises);
  const metadataPromises = queries.map((q) => parsedQueryToMetadata(q));
  const metadatas = await Promise.all(metadataPromises);
  const strings = metadatas.map((metadata, i) => {
    const su = savedUrls[i];
    return `${inlineCode(su.name)}
    ${hyperlink(metadata.title, su.url)} ${italic(metadata.author)} (${
      metadata.numberOfTracks
    } tracks)`;
  });

  return baseEmbed()
    .setAuthor({ name: "Saved URLs" })
    .setDescription(
      `Use ${inlineCode("/load [name]")} to play these saved URLs.`
    )
    .addField("Commands", strings.join("\n\n"));
}

export function getAddedToQueueMessage(
  numberAddedToQueue: number,
  isPlaying: boolean,
  isNext: boolean,
  isShuffle: boolean
) {
  const location = isNext ? "start" : "end";
  const action = isShuffle ? "Shuffled" : "Added";
  const startPlaying = !isPlaying ? "Starting playback!" : "";

  return `${action} ${numberAddedToQueue} track${
    numberAddedToQueue !== 1 ? "s" : ""
  } at the ${location} of the queue. ${startPlaying}`;
}
