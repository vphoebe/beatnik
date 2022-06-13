import { Queue } from "../classes/Queue";
import { parsePlayQuery } from "./parsePlayQuery";
import { parsedQueryToYoutubeQueuedTracks } from "./services/youtube";
import { shuffleArray } from "./util";

export async function addToQueue(
  queue: Queue,
  query: string,
  userId: string,
  shuffle = false,
  next = false
) {
  const parsedQuery = await parsePlayQuery(query);
  let tracks = await parsedQueryToYoutubeQueuedTracks(parsedQuery, userId);
  if (shuffle) {
    tracks = shuffleArray(tracks);
  }
  tracks.forEach((t) => queue.add(t, next));
  return tracks.length;
}
