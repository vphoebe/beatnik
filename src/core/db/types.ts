import type { ProviderPlaylist, ProviderTrack } from "@/providers";

export interface DatabaseTrack extends Omit<ProviderTrack, "providerId"> {
  int_id: number;
  playlistId: number | null;
}

export interface DatabasePlaylist extends Omit<ProviderPlaylist, "tracks"> {
  int_id: number;
  lastUpdated: string;
}

// virtual interface
export interface DatabasePlaylistWithTracks extends DatabasePlaylist {
  tracks: DatabaseTrack[];
}
