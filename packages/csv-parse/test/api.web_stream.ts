import "should";
import { parse as parseStream } from "../lib/stream.js";
import { CsvError } from "../lib/index.js";

describe("API Web Stream", function () {
  describe("stream/web/TransformStream", function () {
    it("simple parse", async function () {
      const stream = parseStream();
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      await writer.write(Buffer.from("A,B,C\nD,E,F"));
      await writer.close();
      await reader.read().should.finally.eql({
        done: false,
        value: ["A", "B", "C"],
      });
      await reader.read().should.finally.eql({
        done: false,
        value: ["D", "E", "F"],
      });
      await reader.read().should.finally.eql({
        done: true,
        value: undefined,
      });
    });

    it("cat error parse", async function () {
      const stream = parseStream();
      const writer = stream.writable.getWriter();
      try {
        await writer.write(Buffer.from("A,B,C\nD,E"));
        await writer.close();
        throw Error("Shall not be called");
      } catch (err) {
        if (!(err instanceof CsvError)) {
          throw Error("Invalid error type");
        }
        err.code.should.eql("CSV_RECORD_INCONSISTENT_FIELDS_LENGTH");
      }
    });
  });

  describe("types", function () {
    type Product = { name: string; quantity: string };
    type ChunksOf<S> = S extends ReadableStream<infer T> ? T : never;

    it("infers string[] records without columns", function () {
      const stream = parseStream();
      const check: ChunksOf<(typeof stream)["readable"]> = [] as string[];
      check;
    });

    it("infers object records with columns", function () {
      const stream = parseStream<Product>({
        columns: ["name", "quantity"],
      });
      const check: ChunksOf<(typeof stream)["readable"]> = {
        name: "screw",
        quantity: "3",
      };
      check;
    });

    it("accepts string chunks as input", function () {
      // Compile-time only: a string stream pipes through without assertions
      const source: ReadableStream<string> = new ReadableStream();
      void source.pipeThrough(parseStream({ columns: true }));
    });

    it("pipes after a string ReadableStream without manual assertions", function () {
      const source: ReadableStream<string> = new ReadableStream({
        start(controller) {
          controller.enqueue("a,b\n");
          controller.enqueue("1,2\n");
          controller.close();
        },
      });
      const stream = source.pipeThrough(parseStream());
      const check: ChunksOf<typeof stream> = [] as string[];
      check;
    });
  });
});
