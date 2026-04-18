import type { ProviderTrack } from "@beatnik/providers";

export function shuffleArray<T>(array: T[]) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = newArray[i];
    newArray[i] = newArray[j];
    newArray[j] = temp;
  }
  return newArray;
}

export interface QueuedTrack extends ProviderTrack {
  addedBy: string;
}

export class Queue {
  tracks: QueuedTrack[] = [];
  currentIndex = 0;

  insert(track: QueuedTrack, start: number) {
    this.tracks.splice(start, 0, track);
  }

  remove(idx: number) {
    return this.tracks.splice(idx, 1);
  }

  shuffle() {
    const before = this.tracks.slice(0, this.currentIndex + 1);
    const after = this.tracks.slice(this.currentIndex + 2);
    const shuffled = shuffleArray(after);
    this.tracks = [...before, ...shuffled];
  }

  getPage(pageNumber: number) {
    // return 10 tracks corresponding to the page number
    const zeroIndexPageNumber = pageNumber - 1;
    if (zeroIndexPageNumber > this.pages - 1) {
      return null;
    }
    const pagedTracks = [...this.tracks].slice(
      zeroIndexPageNumber * 10,
      zeroIndexPageNumber * 10 + 10,
    );
    return pagedTracks;
  }

  get pages() {
    return Math.ceil(this.tracks.length / 10);
  }

  get nowPlaying(): QueuedTrack | undefined {
    return this.tracks[this.currentIndex];
  }
}
