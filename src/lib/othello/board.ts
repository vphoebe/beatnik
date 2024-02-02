import { Coords } from "./coordinates.js";
import { Theme } from "./themes.js";
import { codeBlock } from "discord.js";

export enum Square {
  Dark = 1,
  Light = 2,
  Empty = 0,
}

export type Piece = Square.Dark | Square.Light;

export function opposite(piece: Piece) {
  if (piece === Square.Dark) return Square.Light;
  return Square.Dark;
}

export class Board {
  data: Square[][];

  constructor() {
    // 2D array, idx 0-7 on both axes
    const board: Square[][] = new Array(8)
      .fill(null)
      .map(() => new Array(8).fill(Square.Empty));

    this.data = board;
  }

  get(x: number, y: number): Square | null {
    const column = this.data[x];
    if (column) {
      const piece = column[y];
      if (piece in Square) {
        return piece;
      }
    }
    return null;
  }

  set(x: number, y: number, square: Square) {
    this.data[x][y] = square;
  }

  flip(x: number, y: number): boolean {
    const target = this.get(x, y);
    if (!target) return false;

    const flipped = opposite(target);
    // if undef or empty (0)
    if (!flipped) return false;
    this.set(x, y, flipped);

    return true;
  }

  loop(callbackfn: (x: number, y: number, square: Square) => void) {
    // loop through 2D array by coordinates and piece value
    const board = this.data;
    for (const [x, col] of board.entries()) {
      for (const [y, square] of col.entries()) {
        callbackfn(x, y, square);
      }
    }
  }

  flanked(x: number, y: number, playerPiece: Piece, offset: Coords): Coords[] {
    // for a given playerPiece and offset direction
    // return the opponent's pieces that are "flanked", if any
    // requires a piece of player's type to be endpoint in the direction
    const traversed: Coords[] = [];
    const { x: i, y: j } = offset;
    let continueFlag = false;
    let endcap = false;
    const targetCoords = { x: x + i, y: y + j };
    const initialTarget = this.get(targetCoords.x, targetCoords.y);
    if (initialTarget === opposite(playerPiece)) {
      continueFlag = true;
      while (continueFlag) {
        const targetSquare = this.get(targetCoords.x, targetCoords.y);
        // in bounds pieces, or until we hit the player's piece type
        if (targetSquare !== null && targetSquare === playerPiece) {
          endcap = true;
          continueFlag = false;
        }
        if (targetSquare !== null && targetSquare === opposite(playerPiece)) {
          traversed.push({ x: targetCoords.x, y: targetCoords.y });
          // then increment by the offset and go again
          targetCoords.x = targetCoords.x + i;
          targetCoords.y = targetCoords.y + j;
        } else {
          continueFlag = false;
        }
      }
    }

    return endcap ? traversed : [];
  }

  draw(theme: Theme): string {
    // take board data and return embeddable string
    const rowAlignedBoard = this.data[0].map((_val, y) =>
      this.data.map((row) => row[y])
    );
    // eslint-disable-next-line no-irregular-whitespace
    const boardString =
      theme.colHeading +
      rowAlignedBoard
        .map(
          (row, idx) =>
            `${idx + 1} ${row.map((char) => theme.squares[char]).join(" ")}`
        )
        .join("\n");

    return codeBlock(boardString);
  }
}
