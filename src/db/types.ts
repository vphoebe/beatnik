export interface Playlist {
  int_id: number;
  id: string;
  url: string;
  title: string;
  authorName: string;
  lastUpdated: string;
}

export interface Track {
  int_id: number;
  id: string;
  url: string;
  title: string;
  thumbnailUrl: string;
  length: number;
  channelName: string;
  loudness: number;
  playlistId: number | null;
  playlistIdx: number | null;
}

export interface PlaylistWithTracks extends Playlist {
  tracks: Track[];
}
