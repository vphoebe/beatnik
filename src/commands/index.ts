import install from "./global/install";
import uninstall from "./global/uninstall";
import list from "./list";
import load from "./load";
import play from "./play";
import queue from "./queue";
import remove from "./remove";
import save from "./save";
import shuffle from "./shuffle";
import skip from "./skip";
import stop from "./stop";
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
