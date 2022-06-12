import { QueuedTrack } from "../classes/Queue";
import { getDurationString } from "./util";
import { bold, italic, userMention } from "@discordjs/builders";
import { MessageEmbed } from "discord.js";

const baseEmbed = () =>
  new MessageEmbed()
    .setColor("ORANGE")
    .setTimestamp()
    .setFooter({ text: "sent by beatnik" });

export function getNowPlayingEmbed(track: QueuedTrack) {
  return baseEmbed()
    .setAuthor({ name: "Now playing on beatnik:" })
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
    .setAuthor({ name: "Current queue for beatnik" })
    .addField(`(Page ${pageNumber} of ${totalPages})`, fieldText);
}
