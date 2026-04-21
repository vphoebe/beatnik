import { db } from "./client";
import type { DatabaseTrack } from "./types";

function getTrackByYtId(ytId: string) {
  return db.prepare<[string], DatabaseTrack>("SELECT * FROM Track WHERE id = ? LIMIT 1").get(ytId);
}

function getTrackByIntId(int_id: number) {
  return db
    .prepare<[number], DatabaseTrack>("SELECT * FROM Track WHERE int_id = ? LIMIT 1")
    .get(int_id);
}

function createTrack(trackData: Omit<DatabaseTrack, "int_id">) {
  const { lastInsertRowid } = db
    .prepare<Omit<DatabaseTrack, "int_id">>(
      `
    INSERT INTO Track (id, url, title, thumbnailUrl, length, channelName, loudness, playlistId, playlistIdx, providerId)
    VALUES (@id, @url, @title, @thumbnailUrl, @length, @channelName, @loudness, @playlistId, @playlistIdx, @providerId)
  `,
    )
    .run(trackData);
  return db
    .prepare<[number], DatabaseTrack>("SELECT * FROM Track WHERE int_id = ?")
    .get(Number(lastInsertRowid));
}

function deleteTrack(int_id: number) {
  return db.prepare<[number]>("DELETE FROM Track WHERE int_id = ?").run(int_id);
}

function getAllTracks() {
  return db
    .prepare<
      [],
      Pick<DatabaseTrack, "title" | "channelName" | "int_id" | "id" | "loudness">
    >("SELECT title, channelName, int_id, id, loudness FROM Track")
    .all();
}

function getTracksByPlaylist(int_id: number) {
  return db
    .prepare<[number], DatabaseTrack>("SELECT * FROM Track WHERE playlistId = ?")
    .all(int_id);
}

function getIsolatedTracks() {
  return db
    .prepare<
      [],
      Pick<DatabaseTrack, "title" | "int_id">
    >("SELECT title, int_id FROM Track WHERE playlistId IS NULL")
    .all();
}

function getTrackCount() {
  const result = db.prepare<[], { count: number }>("SELECT COUNT(*) as count FROM track").get();
  return result?.count ?? 0;
}

function updateTrack(id: string, patch: Partial<DatabaseTrack>) {
  const fields = Object.keys(patch)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = Object.values(patch);
  db.prepare(`UPDATE track SET ${fields} WHERE id = ?`).run(...values, id);
}

export const tracks = {
  get: getTrackByYtId,
  getInternal: getTrackByIntId,
  count: getTrackCount,
  isolated: getIsolatedTracks,
  inPlaylist: getTracksByPlaylist,
  all: getAllTracks,
  delete: deleteTrack,
  create: createTrack,
  update: updateTrack,
};
