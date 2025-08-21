import type { InteractionEditReplyOptions, InteractionReplyOptions } from "discord.js";
import { MessageFlags, bold, italic, userMention } from "discord.js";
import { EmbedBuilder } from "discord.js";

import type { YtApiTrack } from "@engine/youtube/metadata";

import type { QueuedTrack } from "@helpers/queue";

function getDurationString(seconds: number | null) {
  if (seconds) {
    const hours = Math.floor(seconds / 60 / 60);
    const minutes = Math.floor(seconds / 60) - hours * 60;
    const sec = Math.floor(seconds % 60);
    return `${hours > 0 ? `${hours}:` : ""}${
      minutes > 10 || !hours ? minutes : `0${minutes}`
    }:${sec < 10 ? `0${sec}` : sec}`;
  }
  return "unknown";
}

const baseEmbed = () =>
  new EmbedBuilder().setColor("#F6921E").setTimestamp().setFooter({ text: "sent by Beatnik" });

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
      `:cinema: ${italic(track.channelName ?? "unknown")} :hourglass: ${getDurationString(
        track.length,
      )} \n:technologist: ${userMention(track.addedBy)} :cd: ${currentIndex} of ${totalQueued} ${
        fromCache ? ":floppy_disk:" : ":globe_with_meridians:"
      }`,
    )
    .setURL(track.url);
}

export function getQueueListEmbed(
  tracks: QueuedTrack[],
  pageNumber: number,
  totalPages: number,
  currentIndex: number,
) {
  const trackStrings = tracks.map((t, relativeIndex) => {
    const indexOffset = 1 + 10 * (pageNumber - 1);
    const shortTitle: string = t.title.length > 50 ? `${t.title.substring(0, 45)}...` : t.title;
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
    trackStrings.length > 0 ? trackStrings.join("\n\n") : "Nothing is after this track.";
  return baseEmbed()
    .setAuthor({ name: "Current queue for Beatnik" })
    .addFields({
      name: `(Page ${pageNumber} of ${totalPages})`,
      value: fieldText,
    });
}

export function getAddedToQueueMessage(
  tracksAddedToQueue: YtApiTrack[],
  isPlaying: boolean,
  isEnd: boolean,
  isShuffle: boolean,
) {
  const count = tracksAddedToQueue.length;
  const location = isEnd ? "end" : "start";
  const action = isShuffle ? "Shuffled" : "Added";
  const startPlaying = !isPlaying ? "Starting playback!" : "";
  const trackInfo =
    count === 1
      ? `${bold(tracksAddedToQueue[0].title)}`
      : `${count} track${count !== 1 ? "s" : ""}`;

  return `${action} ${trackInfo} at the ${location} of the queue. ${startPlaying}`;
}
function ephemeral(content: string): InteractionReplyOptions {
  return { content, flags: MessageFlags.Ephemeral };
}

export const noQueueReply: InteractionReplyOptions = ephemeral(
  "No queue currently exists. Start playing something!",
);

export const errorReply = (
  err: unknown,
  isEphemeral = true,
): InteractionReplyOptions | InteractionEditReplyOptions => {
  const message = `Something went wrong! Tell someone with authority about the following error message: \`\`\`${err}\`\`\``;
  return isEphemeral ? ephemeral(message) : { content: message };
};
