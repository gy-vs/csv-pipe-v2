import { Options } from "./index.js";

/**
 * Record emitted when `objectMode` is enabled. Column functions return a
 * string, a number or null, hence the heterogeneous array.
 */
export type GeneratedRecord = (string | number | null)[];

declare function generate(
  options: Options & { objectMode: true },
): ReadableStream<GeneratedRecord>;
declare function generate(
  options: Options & { objectMode?: false; encoding: string },
): ReadableStream<string>;
declare function generate(
  options: Options & { objectMode?: false; encoding?: null },
): ReadableStream<Buffer>;
declare function generate(options?: Options): ReadableStream<Buffer>;

export { generate, Options };
