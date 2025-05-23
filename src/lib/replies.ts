import { InteractionEditReplyOptions, InteractionReplyOptions, MessageFlags } from "discord.js";

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
