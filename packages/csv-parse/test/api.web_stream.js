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

    describe("string chunks", function () {
      const collect = async (source, options) => {
        const records = [];
        const stream = source.pipeThrough(parseStream(options));
        for await (const record of stream) {
          records.push(record);
        }
        return records;
      };

      it("parses a single string chunk", async function () {
        const records = await collect(ReadableStream.from(["a,b\n1,2\n"]));
        records.should.eql([
          ["a", "b"],
          ["1", "2"],
        ]);
      });

      it("parses string chunks split on record boundaries", async function () {
        const records = await collect(
          ReadableStream.from(["a,b\n", "1,2\n"]),
        );
        records.should.eql([
          ["a", "b"],
          ["1", "2"],
        ]);
      });

      it("parses string chunks split in the middle of a field", async function () {
        const records = await collect(ReadableStream.from(["a", ",b", "\n1", ",2"]));
        records.should.eql([
          ["a", "b"],
          ["1", "2"],
        ]);
      });

      it("parses multibyte characters", async function () {
        const records = await collect(
          ReadableStream.from(["名称,数量\n", "螺丝,3\n"]),
          { columns: true },
        );
        records.should.eql([{ 名称: "螺丝", 数量: "3" }]);
      });

      it("parses multibyte characters split across decoded chunks", async function () {
        // TextDecoderStream buffers partial characters, but emitted string
        // chunks may start and end at arbitrary byte boundaries of the
        // original stream; chunk the raw bytes mid-character. The first
        // chunk contains part of the header so parsing spans both chunks.
        const bytes = new TextEncoder().encode("名称,数量\n螺丝,3\n");
        const sources = [bytes.slice(0, 4), bytes.slice(4)];
        new TextDecoder()
          .decode(sources[0])
          .should.eql("名�"); // ends mid-character if decoded naively
        const records = await collect(
          ReadableStream.from(sources).pipeThrough(new TextDecoderStream()),
          { columns: true },
        );
        records.should.eql([{ 名称: "螺丝", 数量: "3" }]);
      });

      it("parses chunks emitted by TextDecoderStream", async function () {
        const bytes = new TextEncoder().encode("名称,数量\n螺丝,3\n");
        const records = await collect(
          ReadableStream.from([bytes]).pipeThrough(new TextDecoderStream()),
          { columns: true },
        );
        records.should.eql([{ 名称: "螺丝", 数量: "3" }]);
      });

      it("parses Uint8Array chunks", async function () {
        const records = await collect(
          ReadableStream.from([new TextEncoder().encode("a,b\n1,2\n")]),
        );
        records.should.eql([
          ["a", "b"],
          ["1", "2"],
        ]);
      });
    });
  });
});
