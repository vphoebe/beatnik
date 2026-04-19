import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { startDiscord } from "./discord/client";

const pkg = fs.readFileSync(path.join(".", "package.json"), "utf-8");
export const BEATNIK_VERSION = JSON.parse(pkg).version;

console.log(`--------------------------------------------------
welcome to beatnik
version ${BEATNIK_VERSION}
--------------------------------------------------`);

await startDiscord();
