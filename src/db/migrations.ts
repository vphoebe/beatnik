import type { Database } from "better-sqlite3";

interface Migration {
  name: string;
  up: (db: Database) => void;
}

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

const migrations: Migration[] = [
  {
    name: "001_loudness_nullable_and_real",
    up: (db) => {
      const tableInfo = db.prepare("PRAGMA table_info(Track)").all() as ColumnInfo[];
      const loudnessCol = tableInfo.find((col) => col.name === "loudness");
      if (loudnessCol?.notnull === 0 && loudnessCol?.type === "REAL") return;

      db.exec(`
        BEGIN TRANSACTION;
        CREATE TABLE Track_new (
          int_id       INTEGER PRIMARY KEY AUTOINCREMENT,
          id           TEXT NOT NULL,
          url          TEXT NOT NULL,
          title        TEXT NOT NULL,
          thumbnailUrl TEXT NOT NULL,
          length       INTEGER NOT NULL,
          channelName  TEXT NOT NULL,
          loudness     REAL,
          playlistId   INTEGER REFERENCES Playlist(int_id) ON DELETE CASCADE ON UPDATE CASCADE,
          playlistIdx  INTEGER
        );
        INSERT INTO Track_new SELECT * FROM Track;
        UPDATE Track_new SET loudness = NULL;
        DROP TABLE Track;
        ALTER TABLE Track_new RENAME TO Track;
        COMMIT;
      `);
    },
  },
];

export function runMigrations(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Migration (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      name   TEXT NOT NULL UNIQUE,
      ran_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  for (const migration of migrations) {
    const already = db.prepare("SELECT 1 FROM Migration WHERE name = ?").get(migration.name);
    if (already) continue;

    migration.up(db);
    db.prepare("INSERT INTO Migration (name) VALUES (?)").run(migration.name);
    console.log(`[DB] Ran migration: ${migration.name}`);
  }
}
