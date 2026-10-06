import "should";
import { generate as generateStream } from "../lib/stream.js";

describe("API Web Stream Types", function () {
  type ChunksOf<S> = S extends ReadableStream<infer T> ? T : never;

  it("infers records in objectMode", function () {
    const stream = generateStream({ length: 2, objectMode: true });
    const check: ChunksOf<typeof stream> = ["OMH", 1];
    check;
  });

  it("infers strings with encoding", function () {
    const stream = generateStream({ length: 2, encoding: "utf8" });
    const check: ChunksOf<typeof stream> = "OMH,ONKCHhJmjadoA\n";
    check;
  });

  it("infers buffers by default", function () {
    const stream = generateStream({ length: 2 });
    const check: ChunksOf<typeof stream> = Buffer.from("OMH");
    check;
  });

  it("requires no assertion to read records in objectMode", async function () {
    const stream = generateStream({ length: 1, objectMode: true });
    const reader = stream.getReader();
    const { value } = await reader.read();
    if (value !== undefined) {
      // `value` is a record array, indexing yields a field without a cast
      const field: string | number | null = value[0];
      field;
    }
  });
});
