import { Board, Square, Piece, opposite } from "./board.js";
import { MoveDefinition, compass } from "./coordinates.js";
import { Theme, themes } from "./themes.js";
import { EmbedBuilder, User, userMention } from "discord.js";

interface Player {
  user: User;
  moves: MoveDefinition[];
}

export class Game {
  board: Board;
  players: Record<Piece, Player>;
  activePlayer: Piece;
  theme: Theme;

  constructor(player1: User, player2: User) {
    this.board = new Board();
    // fill default pieces on board
    this.board.set(3, 3, Square.Light); // D4
    this.board.set(4, 4, Square.Light); // E5
    this.board.set(4, 3, Square.Dark); // E4
    this.board.set(3, 4, Square.Dark); // D5
    this.players = {
      [Square.Dark]: {
        user: player1,
        moves: this.getValidMoves(Square.Dark),
      },
      [Square.Light]: {
        user: player2,
        moves: this.getValidMoves(Square.Light),
      },
    };
    this.activePlayer = Square.Dark;
    this.theme = themes.default;
  }

  isFinished() {
    const allMoves = Object.entries(this.players)
      .map(([, player]) => player.moves)
      .flat();
    return allMoves.length === 0;
  }

  getWinner(): { user: User; piece: Piece } | undefined {
    let blackCount = 0;
    let whiteCount = 0;
    this.board.loop((_x, _y, piece) => {
      if (piece === Square.Dark) blackCount++;
      if (piece === Square.Light) whiteCount++;
    });
    if (blackCount > whiteCount) {
      return { user: this.players[Square.Dark].user, piece: Square.Dark };
    } else if (whiteCount > blackCount) {
      return { user: this.players[Square.Light].user, piece: Square.Light };
    } else {
      return undefined;
    }
  }

  getPlayerPiece(user: User): Piece | null {
    // return the user's player's piece, or null if not found
    // if user is both players, return the active player
    const entries = Object.entries(this.players).filter(
      ([, player]) => player.user === user
    );
    if (entries.length > 1) return this.activePlayer;
    else if (entries.length === 1) {
      const record = entries[0];
      return parseInt(record[0]) as Piece;
    }
    return null;
  }

  pass() {
    // swap active turn
    this.activePlayer = opposite(this.activePlayer);
  }

  getValidMoves(playerPiece: Piece): MoveDefinition[] {
    const moves: MoveDefinition[] = [];
    const offsets = compass.map((def) => def.offset);
    this.board.loop((x, y, piece) => {
      if (piece !== Square.Empty) return;
      for (const offset of offsets) {
        const flankedCoords = this.board.flanked(x, y, playerPiece, offset);
        if (flankedCoords.length) {
          moves.push({ x, y, offset, flanked: flankedCoords });
        }
      }
    });
    return moves;
  }

  move(x: number, y: number, playerPiece: Piece): boolean {
    // returns `true` if valid move, returns `false` if invalid
    const playerMoves = this.players[playerPiece].moves;
    const validMoves = playerMoves.filter(
      (move) => move.x === x && move.y === y
    );
    if (!validMoves.length) return false;

    // valid move(s)
    this.board.set(x, y, playerPiece);
    validMoves.forEach((move) => {
      move.flanked.forEach((coords) => this.board.flip(coords.x, coords.y));
    });
    this.pass();
    // re-evaluate and store next possible moves
    this.players[playerPiece].moves = this.getValidMoves(playerPiece);
    this.players[opposite(playerPiece)].moves = this.getValidMoves(
      opposite(playerPiece)
    );
    return true;
  }

  getEmbed(winnerPiece?: Piece): EmbedBuilder {
    const playerString = (playerPiece: Piece) => {
      const badge = () => {
        if (winnerPiece) {
          if (winnerPiece === playerPiece) return "(Winner!)";
        } else {
          if (playerPiece === this.activePlayer) return "(next)";
        }
        return "";
      };
      return `\`${this.theme.squares[playerPiece]}\` ${userMention(
        this.players[playerPiece].user.id
      )} ${badge()}`;
    };

    const gameScreen = new EmbedBuilder().addFields([
      {
        name: "Players",
        value: `${playerString(Square.Dark)}\n${playerString(Square.Light)}`,
      },
      {
        name: "Game Board",
        value: this.board.draw(this.theme),
      },
    ]);
    return gameScreen;
  }
}
