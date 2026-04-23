import { config } from "@/core/config";
import { log } from "@/shared";
import { REST, Routes } from "discord.js";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { builder as add } from "./library/add/builder";
import { builder as load } from "./library/load/builder";
import { builder as remove } from "./library/remove/builder";
import { builder as update } from "./library/update/builder";
import { builder as play } from "./play/builder";
import { builder as queue } from "./queue/builder";
import { builder as shuffle } from "./shuffle/builder";
import { builder as skip } from "./skip/builder";
import { builder as stop } from "./stop/builder";

const COMMANDS_VERSION = "1.1.0";
const versionFile = path.join(config.libraryPath, ".commands-version");

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
        component: "DISCORD",
        name: "COMMANDS",
        message: `Command version ${COMMANDS_VERSION} already deployed, skipping.`,
      });
      return;
    }
    const { token, clientId } = config.discord;
    const builders = [add, load, play, queue, remove, shuffle, skip, stop, update];
    const builderDefs = builders.map((b) => b.toJSON());
    const rest = new REST().setToken(token);
    const data = await rest.put(Routes.applicationCommands(clientId), { body: builderDefs });
    const count = Array.isArray(data) ? `${data.length}` : "unknown";

    await writeFile(versionFile, COMMANDS_VERSION, "utf-8");

    log({
      component: "DISCORD",
      name: "COMMANDS",
      message: `Successfully registered ${count} global commands for Beatnik (command version ${COMMANDS_VERSION})`,
    });
  } catch (err) {
    console.error(err);
  }
}
