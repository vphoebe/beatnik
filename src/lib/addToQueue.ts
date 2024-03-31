import { Queue } from "../classes/Queue.js";
import { parsePlayQuery } from "./parsePlayQuery.js";
import { parsedQueryToYoutubeQueuedTracks } from "./yt.js";
import { shuffleArray } from "./util.js";

export async function addToQueue(
  queue: Queue,
  query: string,
  userId: string,
  shuffle = false,
  end = false
) {
  const parsedQuery = await parsePlayQuery(query);
  let tracks = await parsedQueryToYoutubeQueuedTracks(parsedQuery, userId);
  if (shuffle) {
    tracks = shuffleArray(tracks);
  }
  const basis = end ? queue.tracks.length : queue.currentIndex + 1;
  tracks.forEach((t, idx) => queue.add(t, basis + idx));
  return tracks.length;
}
