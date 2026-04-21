import type { QueuedTrack } from "@/core/queue";
import type {
  CommandInteraction,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
} from "discord.js";
import { MessageFlags, bold, italic, userMention } from "discord.js";
import { EmbedBuilder } from "discord.js";

export async function requireVoiceChannel(interaction: CommandInteraction) {
  const requestingUserId = interaction.user.id;
  const requestingMember = interaction.guild?.members.cache.get(requestingUserId);
  if (!requestingMember) throw new Error("No guild member found for this user.");
  const voiceChannel = requestingMember.voice.channel;
  if (!voiceChannel) {
    await interaction.editReply("Please join a voice channel first!");
    return null;
  }
  return voiceChannel;
}

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
  fromCache: boolean | null = false,
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
  tracksAddedToQueue: QueuedTrack[],
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

export function drawProgressBar(total: number, current: number, width = 50) {
  const clamped = current >= total ? total : current;
  const EMPTY_CHAR = "░";
  const FILL_CHAR = "█";
  const SPINNER_CHARS = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";

  const spinner = SPINNER_CHARS[current % SPINNER_CHARS.length];

  const fillLength = Math.floor((clamped / total) * width);
  const emptyLength = width - fillLength;
  const fill = FILL_CHAR.repeat(fillLength);
  const empty = EMPTY_CHAR.repeat(emptyLength);

  const bar = [...fill, ...empty];
  const counter = `[${current}/${total} ${spinner}]`.split("");
  const center = Math.floor(width / 2);
  const start = center - Math.floor(counter.length / 2) - 1;

  bar.splice(start, counter.length, counter.join(""));

  return `\`${bar.join("")}\``;
}
