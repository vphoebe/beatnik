import { InteractionReplyOptions } from "discord.js";

function ephemeral(content: string) {
  return { content, ephemeral: true };
}

export const noQueueReply: InteractionReplyOptions = ephemeral(
  "No queue currently exists. Start playing something!"
);

export const errorReply = (
  err: unknown,
  isEphemeral = true
): InteractionReplyOptions =>
  isEphemeral
    ? ephemeral(`Something went wrong: ${err}`)
    : { content: `Something went wrong: ${err}` };
