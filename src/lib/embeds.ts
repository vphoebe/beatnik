import { QueuedTrack } from "./queue.js";
import { SavedUrl } from "./db.js";
import { parsedQueryToMetadata, parsePlayQuery } from "./yt.js";
import { getDurationString } from "./util.js";
import { bold, inlineCode, italic, userMention } from "discord.js";
import { EmbedBuilder } from "discord.js";

const baseEmbed = () =>
  new EmbedBuilder()
    .setColor("#F6921E")
    .setTimestamp()
    .setFooter({ text: "sent by Beatnik" });

export function getNowPlayingEmbed(
  track: QueuedTrack,
  currentIndex: number,
  totalQueued: number,
  fromCache: boolean | null
) {
  return baseEmbed()
    .setAuthor({
      name: `Now playing on Beatnik`,
    })
    .setTitle(track.title)
    .setThumbnail(track.thumbnailImageUrl ?? "")
    .setDescription(
      `:cinema: ${italic(
        track.channel ?? "unknown"
      )} :hourglass: ${getDurationString(
        track.length
      )} \n:technologist: ${userMention(
        track.addedBy
      )} :cd: ${currentIndex} of ${totalQueued} ${
        fromCache ? ":floppy_disk:" : ":globe_with_meridians:"
      }`
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
    const shortTitle: string =
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
    .addFields({
      name: `(Page ${pageNumber} of ${totalPages})`,
      value: fieldText,
    });
}

export async function getSavedUrlListEmbed(savedUrls: SavedUrl[]) {
  const queryPromises = savedUrls.map((su) => parsePlayQuery(su.url));
  const queries = await Promise.all(queryPromises);
  const metadataPromises = queries.map((q) => parsedQueryToMetadata(q));
  const metadatas = await Promise.all(metadataPromises);
  const strings = metadatas.map((metadata, i) => {
    const su = savedUrls[i];
    return `${inlineCode(su.name)} (${metadata.numberOfTracks} tracks)`;
  });

  return baseEmbed()
    .setAuthor({ name: "Saved URLs" })
    .setDescription(
      `Use ${inlineCode("/load [name]")} to play these saved URLs.`
    )
    .addFields({ name: "Saved URL names", value: strings.join("\n\n") });
}

export function getAddedToQueueMessage(
  numberAddedToQueue: number,
  isPlaying: boolean,
  isEnd: boolean,
  isShuffle: boolean
) {
  const location = isEnd ? "end" : "start";
  const action = isShuffle ? "Shuffled" : "Added";
  const startPlaying = !isPlaying ? "Starting playback!" : "";

  return `${action} ${numberAddedToQueue} track${
    numberAddedToQueue !== 1 ? "s" : ""
  } at the ${location} of the queue. ${startPlaying}`;
}
