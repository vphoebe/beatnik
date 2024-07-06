import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getTrack(trackId: string) {
  return prisma.track.findUnique({ where: { id: trackId } });
}

export async function saveTrack(trackData: Prisma.TrackCreateInput) {
  return prisma.track.create({ data: trackData });
}

export async function getPlaylistWithTracks(playlistId: string) {
  return prisma.playlist.findUnique({
    where: { id: playlistId },
    include: { tracks: true },
  });
}

export async function savePlaylist(playlistData: Prisma.PlaylistCreateInput) {
  return prisma.playlist.create({ data: playlistData });
}

// export async function deleteSavedTrack() {}
// export async function deleteSavedPlaylist() {}
