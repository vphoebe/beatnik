import { REST, Routes } from "discord.js";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { builder as add } from "@commands/add/builder";
import { builder as load } from "@commands/load/builder";
import { builder as play } from "@commands/play/builder";
import { builder as queue } from "@commands/queue/builder";
import { builder as remove } from "@commands/remove/builder";
import { builder as shuffle } from "@commands/shuffle/builder";
import { builder as skip } from "@commands/skip/builder";
import { builder as stop } from "@commands/stop/builder";
import { builder as update } from "@commands/update/builder";

import { getClientId, getLibraryDir, getToken } from "@helpers/environment";
import { log } from "@helpers/logger";

const COMMANDS_VERSION = "1.0.0";
const versionFile = path.join(getLibraryDir(), ".commands-version");

async function shouldDeploy() {
  try {
    const deployedVersion = await readFile(versionFile, "utf-8");
    return deployedVersion.trim() !== COMMANDS_VERSION;
  } catch {
    return true; // file doesn't exist, deploy commands
  }
}

async function main() {
  try {
    if (!(await shouldDeploy())) {
      log({
        type: "INFO",
        user: "BOT",
        message: `Command version ${COMMANDS_VERSION} already installed, skipping deployment.`,
      });
      return;
    }

    const builders = [add, load, play, queue, remove, shuffle, skip, stop, update];
    const builderDefs = builders.map((b) => b.toJSON());
    const token = getToken();
    const clientId = getClientId();
    const rest = new REST().setToken(token);
    const data = await rest.put(Routes.applicationCommands(clientId), { body: builderDefs });
    const count = Array.isArray(data) ? `${data.length}` : "unknown";

    await writeFile(versionFile, COMMANDS_VERSION, "utf-8");

    log({
      type: "INFO",
      user: "BOT",
      message: `Successfully registered ${count} global commands for Beatnik (command version ${COMMANDS_VERSION})`,
    });
  } catch (err) {
    console.error(err);
  }
}

main();
