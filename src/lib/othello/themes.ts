/* eslint-disable no-irregular-whitespace */
import { Square } from "./board.js";

export type Theme = { squares: Record<Square, string>; colHeading: string };

export const themes: Record<string, Theme> = {
  default: {
    squares: {
      [Square.Dark]: "🔵",
      [Square.Light]: "⚪️",
      [Square.Empty]: "🟩",
    },
    colHeading: `  a⬛️b⬛️c⬛️d⬛️e⬛️f⬛️g⬛️h\n`,
  },
};
