import ytpl from "@distube/ytpl";
import { Prisma, PrismaClient } from "@prisma/client";
import { Playlist } from "../youtube/metadata.js";
import { removeDownload } from "./cache.js";

const prisma = new PrismaClient();

export async function getTrackByYtId(ytId: string) {
  return prisma.track.findFirst({ where: { id: ytId } });
}

export async function getTrackByIntId(int_id: number) {
  return prisma.track.findUnique({ where: { int_id } });
}

export async function getTrackByUrl(url: string) {
  return prisma.track.findFirst({ where: { url } });
}

export async function saveTrack(trackData: Prisma.TrackCreateInput) {
  return prisma.track.create({ data: trackData });
}

export async function getPlaylist(int_id: number) {
  return prisma.playlist.findUnique({ where: { int_id } });
}

export async function doesPlaylistExist(id: string) {
  return !!prisma.playlist.findFirst({ where: { id } });
}

export async function getPlaylists() {
  return prisma.playlist.findMany({
    select: {
      title: true,
      int_id: true,
    },
  });
}

export async function getAllTracks() {
  return prisma.track.findMany({
    select: { title: true, channelName: true, int_id: true },
  });
}

export async function getIsolatedTracks() {
  // return tracks that aren't in a playlist
  return prisma.track.findMany({
    where: {
      playlistId: null,
    },
    select: {
      title: true,
      int_id: true,
    },
  });
}

export async function getPlaylistWithTracks(playlistIdOrUrl: string) {
  const id = await ytpl.getPlaylistID(playlistIdOrUrl);
  return prisma.playlist.findFirst({
    where: { id },
    include: { tracks: true },
  });
}

export async function savePlaylist(playlistData: Playlist) {
  return prisma.playlist.create({
    data: {
      id: playlistData.id,
      url: playlistData.url,
      title: playlistData.title,
      authorName: playlistData.authorName,
      tracks: {
        createMany: { data: playlistData.tracks },
      },
      lastUpdated: new Date(),
    },
  });
}

export async function updateSavedPlaylist(playlistData: Playlist) {
  const existingPlaylist = await prisma.playlist.findFirst({
    where: { id: playlistData.id },
  });
  if (!existingPlaylist) {
    return null;
  }

  return await prisma.$transaction([
    prisma.track.deleteMany({
      where: {
        playlistId: existingPlaylist.int_id,
      },
    }),
    prisma.playlist.update({
      where: {
        int_id: existingPlaylist.int_id,
      },
      data: {
        tracks: {
          createMany: { data: playlistData.tracks },
        },
      },
    }),
  ]);
}

export async function deleteSavedTrack(int_id: number) {
  const trackRecord = await prisma.track.findUnique({ where: { int_id } });
  if (!trackRecord) return;
  await removeDownload(trackRecord.id);
  return prisma.track.delete({ where: { int_id } });
}

export async function deleteSavedPlaylist(
  playlistId?: string,
  int_id?: number,
) {
  if (!int_id) {
    const existingPlaylist = await prisma.playlist.findFirst({
      where: { id: playlistId },
    });
    if (!existingPlaylist) {
      return null;
    }
    int_id = existingPlaylist.int_id;
  }

  const trackRecords = await prisma.track.findMany({
    where: { playlistId: int_id },
  });
  const rmPromises = trackRecords.map((t) => removeDownload(t.id));
  await Promise.all(rmPromises);

  return prisma.playlist.delete({
    where: { int_id },
  });
}
