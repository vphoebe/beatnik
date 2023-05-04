import install from './global/install.js';
import uninstall from './global/uninstall.js';
import list from './list.js';
import load from './load.js';
import play from './play.js';
import queue from './queue.js';
import remove from './remove.js';
import save from './save.js';
import shuffle from './shuffle.js';
import skip from './skip.js';
import stop from './stop.js';
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export type Command = {
  builder: SlashCommandBuilder;
  execute: CommandExecuter;
  global: boolean;
};

export type CommandExecuter = (
  interaction: ChatInputCommandInteraction
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
  save,
  load,
  list,
  remove,
};
