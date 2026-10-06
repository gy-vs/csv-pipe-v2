import { ReadableStream } from "node:stream/web";
import { normalize_options, init_state, read } from "./api/index.js";

const generate = (opts) => {
  const options = normalize_options(opts || {});
  const state = init_state(options);
  return new ReadableStream(
    {
      async pull(controller) {
        read(
          options,
          state,
          1024,
          function (chunk) {
            // Mirror the Node.js Readable behavior: in object mode, records
            // are enqueued as-is. Otherwise, strings are converted to
            // buffers, unless `encoding` is set in which case chunks are
            // converted to strings using that encoding.
            if (!options.objectMode) {
              if (options.encoding) {
                chunk = Buffer.isBuffer(chunk)
                  ? chunk.toString(options.encoding)
                  : String(chunk);
              } else {
                chunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
              }
            }
            controller.enqueue(chunk);
          },
          function (err) {
            if (err) {
              controller.error(err);
            } else {
              controller.close();
            }
          },
        );
      },
    },
    { highWaterMark: 1024 },
  );
  // return new Generator(options || {})
};

export { generate };
