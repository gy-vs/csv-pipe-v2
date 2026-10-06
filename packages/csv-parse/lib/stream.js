import { TransformStream, CountQueuingStrategy } from "node:stream/web";
import { CsvError, transform } from "./api/index.js";
import { normalize_options } from "./api/normalize_options.js";

const parse = (opts) => {
  const api = transform(opts);
  let controller;
  const enqueue = (record) => {
    controller.enqueue(record);
  };
  const terminate = () => {
    controller.terminate();
  };
  return new TransformStream(
    {
      start(ctr) {
        controller = ctr;
      },
      transform(chunk) {
        // The parser works on bytes. Node.js streams convert any string
        // chunk to a Buffer (decoded as UTF-8 by default, `decodeStrings`
        // being enabled and the writable side set with `encoding: null`),
        // replicate this behavior as Web Streams commonly emit strings,
        // e.g. when piped after `TextDecoderStream`.
        if (!Buffer.isBuffer(chunk)) {
          chunk = Buffer.from(chunk);
        }
        const error = api.parse(chunk, false, enqueue, terminate);
        if (error) {
          controller.error(error);
        }
      },
      flush() {
        const error = api.parse(undefined, true, enqueue, terminate);
        if (error) {
          controller.error(error);
        }
      },
    },
    new CountQueuingStrategy({ highWaterMark: 1024 }),
    new CountQueuingStrategy({ highWaterMark: 1024 }),
  );
};

export { parse, CsvError, normalize_options };
