import { commandList } from "./commands";
import { getClientId, getToken } from "./lib/environment";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";

const globalCommands = Object.keys(commandList)
  .filter((key) => commandList[key].global)
  .map((key) => commandList[key].builder.toJSON());

const token = getToken();
const clientId = getClientId();

const rest = new REST({ version: "9" }).setToken(token);

rest
  .put(Routes.applicationCommands(clientId), { body: globalCommands })
  .then(() => console.log("Registered Beatnik global commands"))
  .catch((err) => console.error(err));
