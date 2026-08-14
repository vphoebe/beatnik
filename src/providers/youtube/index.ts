import type { Innertube } from "youtubei.js";

import type { Provider } from "../provider";
import type { YoutubeClientConfig } from "./client";
import { createInnertubeClient } from "./client";
import { getPlaylistInfo, getTrackInfo, resolve, search } from "./metadata";
import { createSabrStream } from "./sabr-stream-factory";
import type { SabrPlaybackOptions } from "googlevideo/sabr-stream";
import { EnabledTrackTypes } from "googlevideo/utils";
import Stream from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

export const PROVIDER_ID = "youtube";

const DEFAULT_OPTIONS: SabrPlaybackOptions = {
  audioQuality: "AUDIO_QUALITY_MEDIUM",
  enabledTrackTypes: EnabledTrackTypes.AUDIO_ONLY,
  preferOpus: true,
};

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
      const { audioStream } = await createSabrStream(this.client, id, DEFAULT_OPTIONS);
      return Stream.Readable.fromWeb(audioStream as NodeReadableStream);
    } catch (err) {
      throw new Error(`No compatible streams found for ${id}. ${err}`);
    }
  };
}
