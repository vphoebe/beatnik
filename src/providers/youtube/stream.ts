// adapted from https://github.com/balumohan-azure/YouTube.js/blob/1daf18860eeb040591f168e524e9731f2e980e7e/examples/download/index.ts
// and https://github.com/LuanRT/BgUtils/blob/main/examples/index.ts
import type { ReloadPlaybackContext } from "googlevideo/protos";
import { type SabrPlaybackOptions, SabrStream } from "googlevideo/sabr-stream";
import { buildSabrFormat } from "googlevideo/utils";
import { Constants, type Innertube } from "youtubei.js";

import { getWebPoMinter } from "./minter";

export async function createSabrStream(
  innertube: Innertube,
  videoId: string,
  options: SabrPlaybackOptions,
) {
  const minter = await getWebPoMinter();

  const contentPoToken = await minter.mintAsWebsafeString(videoId);

  const info = await innertube.getBasicInfo(videoId, { client: "YTMUSIC" });

  if (info.playability_status?.status !== "OK") {
    throw new Error(
      `Video is not playable: ${info.playability_status?.status} ` +
        `(${info.playability_status?.reason ?? "no reason given"})`,
    );
  }

  const serverAbrStreamingUrl = await innertube.session.player?.decipher(
    info.streaming_data?.server_abr_streaming_url,
  );
  const ustreamerConfig =
    info.player_config?.media_common_config.media_ustreamer_request_config
      ?.video_playback_ustreamer_config;

  if (!ustreamerConfig)
    throw new Error("Could not find the ustreamer config in the player response.");
  if (!serverAbrStreamingUrl)
    throw new Error("This video has no SABR streaming URL (it may use the legacy protocol).");

  const formats = info.streaming_data?.adaptive_formats.map(buildSabrFormat) ?? [];

  const stream = new SabrStream({
    formats,
    serverAbrStreamingUrl,
    videoPlaybackUstreamerConfig: ustreamerConfig,
    poToken: contentPoToken,
    clientInfo: {
      clientName: parseInt(
        Constants.CLIENT_NAME_IDS[
          innertube.session.context.client.clientName as keyof typeof Constants.CLIENT_NAME_IDS
        ],
      ),
      clientVersion: innertube.session.context.client.clientVersion,
    },
  });

  // The server may ask us to reload the player response (e.g. when formats expire).
  stream.on("reloadPlayerResponse", async (_reloadPlaybackContext: ReloadPlaybackContext) => {
    const reloaded = await innertube.getBasicInfo(videoId);
    const url = await innertube.session.player?.decipher(
      reloaded.streaming_data?.server_abr_streaming_url,
    );
    const config =
      reloaded.player_config?.media_common_config.media_ustreamer_request_config
        ?.video_playback_ustreamer_config;
    if (url && config) {
      stream.setStreamingURL(url);
      stream.setUstreamerConfig(config);
    }
  });

  return stream.start(options);
}
