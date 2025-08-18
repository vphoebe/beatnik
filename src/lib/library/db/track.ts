import { Prisma } from "@generated/client";

import { prisma } from "./client";

export async function getTrackByYtId(ytId: string) {
  return prisma.track.findFirst({ where: { id: ytId } });
}

export async function getTrackByIntId(int_id: number) {
  return prisma.track.findUnique({ where: { int_id } });
}

export async function createTrack(trackData: Prisma.TrackCreateInput) {
  return prisma.track.create({ data: trackData });
}

export async function deleteTrack(int_id: number) {
  return prisma.track.delete({ where: { int_id } });
}

export async function getAllTracks() {
  return prisma.track.findMany({
    select: {
      title: true,
      channelName: true,
      int_id: true,
      id: true,
      loudness: true,
    },
  });
}

export async function getTracksByPlaylist(int_id: number) {
  return prisma.track.findMany({
    where: { playlistId: int_id },
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

export async function getTrackCount() {
  return prisma.track.count();
}
