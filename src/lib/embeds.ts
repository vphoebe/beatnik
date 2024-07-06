import { QueuedTrack } from "./queue.js";
import { getDurationString } from "./util.js";
import { bold, italic, userMention } from "discord.js";
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
  fromCache: boolean | null,
) {
  return baseEmbed()
    .setAuthor({
      name: `Now playing on Beatnik`,
    })
    .setTitle(track.title)
    .setThumbnail(track.thumbnailUrl ?? "")
    .setDescription(
      `:cinema: ${italic(
        track.channelName ?? "unknown",
      )} :hourglass: ${getDurationString(
        track.length,
      )} \n:technologist: ${userMention(
        track.addedBy,
      )} :cd: ${currentIndex} of ${totalQueued} ${
        fromCache ? ":floppy_disk:" : ":globe_with_meridians:"
      }`,
    )
    .setURL(`https://www.youtube.com/watch?v=${track.id}`);
}

export function getQueueListEmbed(
  tracks: QueuedTrack[],
  pageNumber: number,
  totalPages: number,
  currentIndex: number,
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
        t.channelName ?? "unknown author",
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

export function getAddedToQueueMessage(
  numberAddedToQueue: number,
  isPlaying: boolean,
  isEnd: boolean,
  isShuffle: boolean,
) {
  const location = isEnd ? "end" : "start";
  const action = isShuffle ? "Shuffled" : "Added";
  const startPlaying = !isPlaying ? "Starting playback!" : "";

  return `${action} ${numberAddedToQueue} track${
    numberAddedToQueue !== 1 ? "s" : ""
  } at the ${location} of the queue. ${startPlaying}`;
}
