import fs from "fs";
import path from "path";
import { Shortcut } from "../types";

const shortcutFilePath = path.resolve(__dirname, "../config/shortcuts.json");

let shortcuts: Shortcut[] | null = null;

if (fs.existsSync(shortcutFilePath)) {
  const file = fs.readFileSync(shortcutFilePath, "utf-8");
  shortcuts = JSON.parse(file);
}

export default shortcuts;
