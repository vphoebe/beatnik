import { REST, Routes } from "discord.js";

import { getClientId, getToken } from "lib/environment";
import { log } from "lib/logger";

import { builder as add } from "commands/add/builder";
import { builder as load } from "commands/load/builder";
import { builder as play } from "commands/play/builder";
import { builder as queue } from "commands/queue/builder";
import { builder as remove } from "commands/remove/builder";
import { builder as shuffle } from "commands/shuffle/builder";
import { builder as skip } from "commands/skip/builder";
import { builder as stop } from "commands/stop/builder";
import { builder as update } from "commands/update/builder";

async function main() {
  try {
    const builders = [add, load, play, queue, remove, shuffle, skip, stop, update];
    const builderDefs = builders.map((b) => b.toJSON());
    const token = getToken();
    const clientId = getClientId();
    const rest = new REST().setToken(token);
    const data = await rest.put(Routes.applicationCommands(clientId), { body: builderDefs });
    const count = Array.isArray(data) ? `${data.length}` : "unknown";

    log({
      type: "INFO",
      user: "BOT",
      message: `Successfully registered ${count} global commands for Beatnik.`,
    });
  } catch (err) {
    console.error(err);
  }
}

main();
