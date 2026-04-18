import { log } from "@beatnik/shared";
import { REST, Routes } from "discord.js";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getClientId, getLibraryDir, getToken } from "../../core/environment";
import { builder as add } from "./library/add/builder";
import { builder as load } from "./library/load/builder";
import { builder as remove } from "./library/remove/builder";
import { builder as update } from "./library/update/builder";
import { builder as play } from "./play/builder";
import { builder as queue } from "./queue/builder";
import { builder as shuffle } from "./shuffle/builder";
import { builder as skip } from "./skip/builder";
import { builder as stop } from "./stop/builder";

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

export async function deployCommands() {
  try {
    if (!(await shouldDeploy())) {
      log({
        type: "INFO",
        user: "BOT",
        message: `Command version ${COMMANDS_VERSION} already deployed, skipping.`,
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
