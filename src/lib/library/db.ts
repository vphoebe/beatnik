import ytpl from "@distube/ytpl";
import { Prisma, PrismaClient } from "@prisma/client";
import { Playlist } from "../youtube/metadata.js";

const prisma = new PrismaClient();

export async function getTrack(trackId: string) {
  return prisma.track.findFirst({ where: { id: trackId } });
}

export async function getTrackByUrl(url: string) {
  return prisma.track.findFirst({ where: { url } });
}

export async function saveTrack(trackData: Prisma.TrackCreateInput) {
  return prisma.track.create({ data: trackData });
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

export async function updateSavedPlaylist(playlist: Playlist) {
  const existingPlaylist = await prisma.playlist.findFirst({
    where: { id: playlist.id },
  });
  if (!existingPlaylist) {
    return null;
  }
  return prisma.$transaction([
    prisma.track.deleteMany({
      where: { playlistId: existingPlaylist?.int_id },
    }),
    prisma.playlist.update({
      where: {
        int_id: existingPlaylist.int_id,
      },
      data: {
        tracks: {
          createMany: { data: playlist.tracks },
        },
      },
    }),
  ]);
}

export async function deleteSavedTrack(trackId: string) {
  return prisma.track.deleteMany({ where: { id: trackId } });
}

export async function deleteSavedPlaylist(playlistId: string) {
  const existingPlaylist = await prisma.playlist.findFirst({
    where: { id: playlistId },
  });
  if (!existingPlaylist) {
    return null;
  }
  return prisma.playlist.delete({
    where: { int_id: existingPlaylist.int_id },
    include: { tracks: true },
  });
}
