import { Options } from "./index.js";

/**
 * Record yielded in object mode: an array of values produced by the
 * configured column generators.
 */
type ObjectModeRecord = (string | number | null)[];

type ObjectModeOptions = Omit<Options, "objectMode" | "object_mode"> & {
  objectMode: true;
};
type ObjectModeOptionsUnderscore = Omit<Options, "objectMode" | "object_mode"> & {
  object_mode: true;
};
type EncodedOptions = Omit<
  Options,
  "objectMode" | "object_mode" | "encoding"
> & {
  objectMode?: false;
  object_mode?: false;
  encoding: BufferEncoding;
};
type BufferOptions = Omit<
  Options,
  "objectMode" | "object_mode" | "encoding"
> & {
  objectMode?: false;
  object_mode?: false;
  encoding?: null | undefined;
};

declare function generate(options: ObjectModeOptions): ReadableStream<ObjectModeRecord>;
declare function generate(options: ObjectModeOptionsUnderscore): ReadableStream<ObjectModeRecord>;
declare function generate(options: EncodedOptions): ReadableStream<string>;
declare function generate(options?: BufferOptions): ReadableStream<Buffer>;

export { generate, Options };
