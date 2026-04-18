import type { Innertube } from "youtubei.js";

import type { Provider } from "../provider";
import { type YoutubeClientConfig, createInnertubeClient } from "./client";
import { getPlaylistInfo, getTrackInfo, resolve, search } from "./metadata";
import { createSabrStream } from "./sabr";

export const PROVIDER_ID = "youtube";

export class YoutubeProvider implements Provider {
  readonly id = PROVIDER_ID;
  private constructor(private client: Innertube) {}

  // use this instead of new YoutubeProvider() to init/share client
  static async create(config: YoutubeClientConfig = {}): Promise<YoutubeProvider> {
    const client = await createInnertubeClient(config);
    return new YoutubeProvider(client);
  }

  resolve = (query: string) => resolve(this.client, query);
  getTrack = (id: string) => getTrackInfo(this.client, id);
  getPlaylist = (id: string) => getPlaylistInfo(this.client, id);
  search = (query: string) => search(this.client, query);
  getStream = async (id: string) => {
    try {
      return createSabrStream(this.client, id);
    } catch (err) {
      throw new Error(`No compatible streams found for ${id}. ${err}`);
    }
  };
}
