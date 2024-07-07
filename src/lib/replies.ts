import { InteractionReplyOptions } from "discord.js";

function ephemeral(content: string) {
  return { content, ephemeral: true };
}

export const noQueueReply: InteractionReplyOptions = ephemeral(
  "No queue currently exists. Start playing something!",
);

export const errorReply = (err: unknown, isEphemeral = true): InteractionReplyOptions => {
  const message = `Something went wrong! Tell someone with authority about the following error message: \`\`\`${err}\`\`\``;
  return isEphemeral ? ephemeral(message) : { content: message };
};
