import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

import add from "./add";
import load from "./load";
import move from "./othello/move";
import pass from "./othello/pass";
import rules from "./othello/rules";
import start from "./othello/start";
import play from "./play";
import queue from "./queue";
import remove from "./remove";
import shuffle from "./shuffle";
import skip from "./skip";
import stop from "./stop";
import update from "./update";

export type Command = {
  builder: SlashCommandBuilder;
  execute: CommandExecuter;
  autocomplete?: AutocompleteHandler;
};

export type AutocompleteHandler = (interaction: AutocompleteInteraction) => Promise<void>;

export type CommandExecuter = (interaction: ChatInputCommandInteraction) => Promise<void>;

export type CommandList = {
  [commandKey: string]: Command;
};

export const commandList: CommandList = {
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
