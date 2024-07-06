import install from "./global/install.js";
import uninstall from "./global/uninstall.js";
import play from "./play.js";
import queue from "./queue.js";
import add from "./add.js";
import shuffle from "./shuffle.js";
import skip from "./skip.js";
import stop from "./stop.js";
import move from "./othello/move.js";
import pass from "./othello/pass.js";
import start from "./othello/start.js";
import rules from "./othello/rules.js";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export type Command = {
  builder: SlashCommandBuilder;
  execute: CommandExecuter;
  global: boolean;
};

export type CommandExecuter = (
  interaction: ChatInputCommandInteraction,
) => Promise<void>;

export type CommandList = {
  [commandKey: string]: Command;
};

export const commandList: CommandList = {
  install,
  uninstall,
  play,
  queue,
  stop,
  skip,
  shuffle,
  add,
  move,
  pass,
  rules,
  start,
};
