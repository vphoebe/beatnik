import { REST, Routes } from "discord.js";

import { getClientId, getToken } from "lib/environment.js";
import { log } from "lib/logger.js";

import { commandList } from "commands/index.js";

async function main() {
  try {
    const commandDefinitions = Object.keys(commandList).map((key) =>
      commandList[key].builder.toJSON(),
    );
    const token = getToken();
    const clientId = getClientId();
    const rest = new REST().setToken(token);
    const data = await rest.put(Routes.applicationCommands(clientId), { body: commandDefinitions });
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
