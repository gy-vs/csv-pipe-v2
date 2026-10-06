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
      // The parser operates on bytes. Node streams transparently convert
      // string chunks to buffers using the stream default encoding (utf8),
      // Web Streams do not, hence the conversion here. TextDecoderStream
      // only emits chunks that are valid unicode and never splits a
      // multibyte character across chunks.
      transform(chunk) {
        try {
          const buf =
            typeof chunk === "string" ? Buffer.from(chunk, "utf8") : chunk;
          const error = api.parse(buf, false, enqueue, terminate);
          if (error) {
            controller.error(error);
          }
        } catch (error) {
          controller.error(error);
        }
      },
      flush() {
        try {
          const error = api.parse(undefined, true, enqueue, terminate);
          if (error) {
            controller.error(error);
          }
        } catch (error) {
          controller.error(error);
        }
      },
    },
    new CountQueuingStrategy({ highWaterMark: 1024 }),
    new CountQueuingStrategy({ highWaterMark: 1024 }),
  );
};

export { parse, CsvError, normalize_options };
