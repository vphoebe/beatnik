import { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";

import * as add from "./add/command";
import * as load from "./load/command";
import * as play from "./play/command";
import * as queue from "./queue/command";
import * as remove from "./remove/command";
import * as shuffle from "./shuffle/command";
import * as skip from "./skip/command";
import * as stop from "./stop/command";
import * as update from "./update/command";

export type Command = {
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
};
