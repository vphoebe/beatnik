import ytpl from "@distube/ytpl";
import { prisma } from "./client.js";
import { YtApiPlaylist } from "../../youtube/metadata.js";

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

export async function getPlaylistWithTracks(playlistIdOrUrl: string) {
  const id = await ytpl.getPlaylistID(playlistIdOrUrl);
  return prisma.playlist.findFirst({
    where: { id },
    include: { tracks: true },
  });
}

export async function savePlaylist(playlistData: YtApiPlaylist) {
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

export async function updateSavedPlaylist(playlistData: YtApiPlaylist) {
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
