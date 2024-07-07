import { User } from "discord.js";

import { Game } from "./game.js";

class StateManager {
  guilds: Map<string, Game[]>;
  constructor() {
    this.guilds = new Map();
  }

  get(guildId: string, user: User) {
    const guildGames = this.guilds.get(guildId);
    return guildGames?.find((game) => game.getPlayerPiece(user) !== null);
  }

  set(guildId: string, value: Game) {
    const guildGames = this.guilds.get(guildId);
    this.guilds.set(guildId, [...(guildGames ?? []), value]);
  }

  delete(guildId: string, user: User) {
    const guildGames = this.guilds.get(guildId);
    if (guildGames) {
      const game = guildGames?.findIndex((game) => game.getPlayerPiece(user) !== null);
      if (game !== -1) {
        const withRemoved = [...guildGames];
        withRemoved.splice(game, 1);
        this.guilds.set(guildId, withRemoved);
        console.log(`Game for ${guildId} / ${user.displayName} was deleted.`);
      }
    }
  }
}

export const state = new StateManager();
