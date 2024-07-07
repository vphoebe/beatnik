import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

import add from "./add.js";
import install from "./global/install.js";
import uninstall from "./global/uninstall.js";
import load from "./load.js";
import move from "./othello/move.js";
import pass from "./othello/pass.js";
import rules from "./othello/rules.js";
import start from "./othello/start.js";
import play from "./play.js";
import queue from "./queue.js";
import remove from "./remove.js";
import shuffle from "./shuffle.js";
import skip from "./skip.js";
import stop from "./stop.js";
import update from "./update.js";

export type Command = {
  builder: SlashCommandBuilder;
  execute: CommandExecuter;
  autocomplete?: AutocompleteHandler;
  global: boolean;
};

export type AutocompleteHandler = (interaction: AutocompleteInteraction) => Promise<void>;

export type CommandExecuter = (interaction: ChatInputCommandInteraction) => Promise<void>;

export type CommandList = {
  [commandKey: string]: Command;
};

export const commandList: CommandList = {
  install,
  uninstall,
  play,
  load,
  update,
  queue,
  stop,
  skip,
  shuffle,
  add,
  remove,
  move,
  pass,
  rules,
  start,
};
