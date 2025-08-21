import { Browser, impersonate } from "node-libcurl-ja3";
import type { Readable } from "stream";

export async function fetchStream(url: string): Promise<Readable> {
  const curly = impersonate(Browser.Firefox136);
  const { data: stream, statusCode } = await curly.get<Readable>(url, {
    curlyStreamResponse: true,
    followLocation: true,
  });
  if (statusCode !== 200) {
    throw new Error(`${statusCode}`);
  }
  return stream;
}
