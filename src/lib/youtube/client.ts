import { Stream } from "node:stream";
import { ClientType, Innertube, UniversalCache } from "youtubei.js";

export const yt = await Innertube.create({
  cache: new UniversalCache(false),
  client_type: ClientType.WEB,
});

export const getYtStream = async (id: string) => {
  const innertubeStream = await yt.download(id, {
    type: "audio",
    client: "WEB",
  });

  return Stream.Readable.fromWeb(innertubeStream);
};
