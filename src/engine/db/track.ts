import { db } from "./client";
import type { Track } from "./types";

export function getTrackByYtId(ytId: string) {
  return db.prepare<[string], Track>("SELECT * FROM Track WHERE id = ? LIMIT 1").get(ytId);
}

export function getTrackByIntId(int_id: number) {
  return db.prepare<[number], Track>("SELECT * FROM Track WHERE int_id = ? LIMIT 1").get(int_id);
}

export function createTrack(trackData: Omit<Track, "int_id">) {
  const { lastInsertRowid } = db
    .prepare<Omit<Track, "int_id">>(
      `
    INSERT INTO Track (id, url, title, thumbnailUrl, length, channelName, loudness, playlistId, playlistIdx)
    VALUES (@id, @url, @title, @thumbnailUrl, @length, @channelName, @loudness, @playlistId, @playlistIdx)
  `,
    )
    .run(trackData);
  return db
    .prepare<[number], Track>("SELECT * FROM Track WHERE int_id = ?")
    .get(Number(lastInsertRowid));
}

export function deleteTrack(int_id: number) {
  return db.prepare<[number]>("DELETE FROM Track WHERE int_id = ?").run(int_id);
}

export function getAllTracks() {
  return db
    .prepare<
      [],
      Pick<Track, "title" | "channelName" | "int_id" | "id" | "loudness">
    >("SELECT title, channelName, int_id, id, loudness FROM Track")
    .all();
}

export function getTracksByPlaylist(int_id: number) {
  return db.prepare<[number], Track>("SELECT * FROM Track WHERE playlistId = ?").all(int_id);
}

export function getIsolatedTracks() {
  return db
    .prepare<
      [],
      Pick<Track, "title" | "int_id">
    >("SELECT title, int_id FROM Track WHERE playlistId IS NULL")
    .all();
}

export function getTrackCount() {
  const result = db.prepare<[], { count: number }>("SELECT COUNT(*) as count FROM track").get();
  return result?.count ?? 0;
}
