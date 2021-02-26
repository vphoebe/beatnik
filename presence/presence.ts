import { Client } from "discord.js";
import BeatTime from "../classes/BeatTime";
let currentBeats: string;

export default (client: Client) => {
  const setPresence = () => {
    const newBeats = new BeatTime().string;
    if (newBeats !== currentBeats) {
      currentBeats = newBeats;
      client.user?.setPresence({
        activity: {
          name: currentBeats,
          type: "PLAYING",
        },
      });
    }
  };
  setPresence();
  return setInterval(setPresence, 500);
};
