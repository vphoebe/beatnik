import Discord from "discord.js";
import { prefix, shortcuts } from "../../config.json";

export function listShortcuts(message: Discord.Message) {
  if (shortcuts.length > 0) {
    const shortcutStrings = shortcuts.map(
      (shortcut) =>
        `\`${prefix}${shortcut.shortcut}\`: ${shortcut.description}\n`
    );
    const shortcutEmbed = new Discord.MessageEmbed()
      .setColor("#ed872d")
      .setTitle("Configured shortcuts")
      .setDescription(shortcutStrings.join("\n"))
      .setTimestamp()
      .setFooter("sent by beatnik");
    message.channel.send(shortcutEmbed);
  }
}
