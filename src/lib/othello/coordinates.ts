import { Square } from "./board";

export interface Coords {
  x: number; // letter/column
  y: number; // number/row
}

export interface MoveDefinition extends Coords {
  offset: Coords;
  flanked: Coords[];
}

export interface AdjCoords extends Coords {
  val: Square;
  offset: Coords;
}

export const compass: { dir: string; offset: Coords }[] = [
  { dir: "N", offset: { x: 0, y: -1 } },
  { dir: "NE", offset: { x: 1, y: -1 } },
  { dir: "E", offset: { x: 1, y: 0 } },
  { dir: "SE", offset: { x: 1, y: 1 } },
  { dir: "S", offset: { x: 0, y: 1 } },
  { dir: "SW", offset: { x: -1, y: 1 } },
  { dir: "W", offset: { x: -1, y: 0 } },
  { dir: "Nw", offset: { x: -1, y: -1 } },
];

const letterMap = ["A", "B", "C", "D", "E", "F", "G", "H"];

export const isInBounds = (coords: Coords): boolean => {
  const { x, y } = coords;
  return x >= 0 && x <= 7 && y >= 0 && y <= 7;
};

export const coordsToGrid = (coords: Coords): string => {
  const { x, y } = coords;
  return `${letterMap[x]}${y + 1}`;
};

export const gridToCoords = (grid: string): Coords | null => {
  const [letter, number] = grid.split("", 2);
  const x = letterMap.findIndex((val) => val === letter.toLocaleUpperCase());
  const y = parseInt(number) - 1;
  const coords = { x, y };
  return isInBounds(coords) ? coords : null;
};
