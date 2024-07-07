import { commandList } from "./commands/index.js";
import { getClientId, getToken } from "./lib/environment.js";
import { log } from "./lib/logger.js";
import { REST, Routes } from "discord.js";

const globalCommands = Object.keys(commandList)
  .filter((key) => commandList[key].global)
  .map((key) => commandList[key].builder.toJSON());

const token = getToken();
const clientId = getClientId();

const rest = new REST({ version: "9" }).setToken(token);

rest
  .put(Routes.applicationCommands(clientId), { body: globalCommands })
  .then(() => {
    log({
      type: "INFO",
      user: "BOT",
      message: "Registered global commands.",
    });
    process.exit(0);
  })
  .catch((err) => console.error(err));
