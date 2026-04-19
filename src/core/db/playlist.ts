import type { ProviderPlaylist } from "@/providers";

import { db } from "./client";
import type { DatabasePlaylist, DatabasePlaylistWithTracks, DatabaseTrack } from "./types";

function getPlaylist(int_id: number) {
  const stmt = db.prepare<[number], DatabasePlaylist>("SELECT * FROM playlist WHERE int_id = ?");
  return stmt.get(int_id);
}

function doesPlaylistExist(id: string) {
  const matches = db
    .prepare<[string], DatabasePlaylist>("SELECT * FROM playlist WHERE id = ?")
    .all(id);
  return matches.length !== 0;
}

function getPlaylists() {
  return db
    .prepare<[], Pick<DatabasePlaylist, "int_id" | "title">>("SELECT title, int_id FROM playlist")
    .all();
}

function getSavedPlaylistById(id: string) {
  const playlist = db
    .prepare<[string], DatabasePlaylist>("SELECT * FROM playlist WHERE id = ? LIMIT 1")
    .get(id);

  if (!playlist) return undefined;

  const tracks = db
    .prepare<[number], DatabaseTrack>("SELECT * FROM track WHERE playlistId = ?")
    .all(playlist.int_id);

  return { ...playlist, tracks } as DatabasePlaylistWithTracks;
}

function savePlaylist(playlistData: ProviderPlaylist) {
  const insertPlaylist = db.prepare<Omit<DatabasePlaylist, "int_id">>(`
    INSERT INTO playlist (id, url, title, authorName, lastUpdated)
    VALUES (@id, @url, @title, @authorName, @lastUpdated)
  `);

  const insertTrack = db.prepare<Omit<DatabaseTrack, "int_id">>(`
    INSERT INTO track (id, url, title, thumbnailUrl, length, channelName, loudness, playlistId, playlistIdx)
    VALUES (@id, @url, @title, @thumbnailUrl, @length, @channelName, @loudness, @playlistId, @playlistIdx)
  `);

  const transaction = db.transaction((data: ProviderPlaylist) => {
    const { lastInsertRowid } = insertPlaylist.run({
      id: data.id,
      url: data.url,
      title: data.title,
      authorName: data.authorName,
      lastUpdated: new Date().toISOString(),
    });

    const createdId = Number(lastInsertRowid);

    for (const track of data.tracks) {
      insertTrack.run({
        ...track,
        playlistId: createdId,
        playlistIdx: data.tracks.indexOf(track),
      });
    }
  });

  return transaction(playlistData);
}

function updateSavedPlaylist(playlistData: ProviderPlaylist) {
  const existingPlaylist = db
    .prepare<[string], DatabasePlaylist>("SELECT * FROM Playlist WHERE id = ? LIMIT 1")
    .get(playlistData.id);

  if (!existingPlaylist) return null;

  const deleteTracks = db.prepare<[number]>("DELETE FROM Track WHERE playlistId = ?");

  const insertTrack = db.prepare<Omit<DatabaseTrack, "int_id">>(`
    INSERT INTO Track (id, url, title, thumbnailUrl, length, channelName, loudness, playlistId, playlistIdx)
    VALUES (@id, @url, @title, @thumbnailUrl, @length, @channelName, @loudness, @playlistId, @playlistIdx)
  `);

  const transaction = db.transaction(() => {
    deleteTracks.run(existingPlaylist.int_id);
    for (const track of playlistData.tracks) {
      insertTrack.run({
        ...track,
        playlistId: existingPlaylist.int_id,
        playlistIdx: playlistData.tracks.indexOf(track),
      });
    }
  });

  return transaction();
}

function deleteSavedPlaylist(int_id: number) {
  const stmt = db.prepare<[number], DatabasePlaylist>(
    "SELECT title FROM playlist WHERE int_id = ?",
  );
  const result = stmt.get(int_id);
  db.prepare<[number]>("DELETE FROM Playlist WHERE int_id = ?").run(int_id);
  return { title: result?.title ?? "Unknown" };
}

function getPlaylistCount() {
  const result = db.prepare<[], { count: number }>("SELECT COUNT(*) as count FROM playlist").get();
  return result?.count ?? 0;
}

export const playlists = {
  getInfo: getPlaylist,
  getTracks: getSavedPlaylistById,
  exists: doesPlaylistExist,
  count: getPlaylistCount,
  update: updateSavedPlaylist,
  delete: deleteSavedPlaylist,
  all: getPlaylists,
  create: savePlaylist,
};
