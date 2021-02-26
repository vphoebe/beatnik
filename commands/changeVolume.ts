import Discord from "discord.js";
import { Queue } from "../types";

export function changeVolume(message: Discord.Message, serverQueue: Queue) {
  const args = message.content.split(" ");
  const inputValue = args[1];
  if (inputValue && serverQueue) {
    const parsedValue = parseInt(inputValue);
    if (parsedValue && parsedValue <= 100 && parsedValue >= 0) {
      const dispatcher = serverQueue.connection?.dispatcher ?? null;
      if (dispatcher) {
        dispatcher.setVolume(parsedValue / 100);
        message.channel.send(`Changing volume to ${parsedValue}%...`);
      }
    } else {
      message.channel.send("Please input a number between 0 and 100.");
    }
  } else if (!serverQueue) {
    message.channel.send("Start playing something to change the volume.");
  } else {
    message.channel.send(`The current volume is ${serverQueue.volume * 100}%`);
  }
}
