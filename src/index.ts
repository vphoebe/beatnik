import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { testLibraryConnection } from "./core/cache/operations";
import { initProviders } from "./core/manager";
import { startDiscord } from "./discord/client";

const pkg = fs.readFileSync(path.join(".", "package.json"), "utf-8");
export const BEATNIK_VERSION = JSON.parse(pkg).version;

const logo = `
  _                _         _ _
 | |__   ___  __ _| |_ _ __ (_) | __
 | '_ \\ / _ \\/ _\` | __| '_ \\| | |/ /
 | |_) |  __/ (_| | |_| | | | |   <
 |_.__/ \\___|\\__,_|\\__|_| |_|_|_|\\_\\
`;

console.log(`${logo}
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░       welcome to beatnik!      ░░
░░       version ${BEATNIK_VERSION}            ░░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
`);

await initProviders();
await testLibraryConnection();
await startDiscord();
