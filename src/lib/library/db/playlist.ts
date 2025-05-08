import { YtApiPlaylist } from "../../youtube/metadata.js";
import { prisma } from "./client.js";

export async function getPlaylist(int_id: number) {
  return prisma.playlist.findUnique({ where: { int_id } });
}

export async function doesPlaylistExist(id: string) {
  return (await prisma.playlist.findMany({ where: { id } })).length !== 0;
}

export async function getPlaylists() {
  return prisma.playlist.findMany({
    select: {
      title: true,
      int_id: true,
    },
  });
}

export async function getSavedPlaylistByUrl(url: string) {
  return prisma.playlist.findFirst({
    where: { url },
    include: { tracks: true },
  });
}

export async function getSavedPlaylistById(id: string) {
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

export async function deleteSavedPlaylist(int_id: number) {
  return prisma.playlist.delete({
    where: { int_id },
  });
}
