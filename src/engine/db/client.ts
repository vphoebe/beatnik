import Database from "better-sqlite3";

import { getDatabaseURL } from "@helpers/environment";

const url = getDatabaseURL();

const tableInit = `
  CREATE TABLE IF NOT EXISTS Playlist (
    int_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    id          TEXT NOT NULL,
    url         TEXT NOT NULL,
    title       TEXT NOT NULL,
    authorName  TEXT NOT NULL,
    lastUpdated TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Track (
    int_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    id           TEXT NOT NULL,
    url          TEXT NOT NULL,
    title        TEXT NOT NULL,
    thumbnailUrl TEXT NOT NULL,
    length       INTEGER NOT NULL,
    channelName  TEXT NOT NULL,
    loudness     INTEGER NOT NULL,
    playlistId   INTEGER REFERENCES Playlist(int_id) ON DELETE CASCADE ON UPDATE CASCADE,
    playlistIdx  INTEGER
  );
`;

async function getDatabaseClient() {
  const db = new Database(url);
  db.pragma("journal_mode = DELETE");
  db.pragma("foreign_keys = ON");
  db.exec(tableInit);
  return db;
}

export const db = await getDatabaseClient();
