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

    it("accepts string chunks", async function () {
      const stream = parseStream();
      const writer = stream.writable.getWriter();
      // TextDecoderStream emits strings, no manual cast expected
      await writer.write("A,B,C\nD,E,F\n");
      await writer.close();
      const records: string[][] = [];
      for await (const record of stream.readable) {
        records.push(record);
      }
      records.should.eql([
        ["A", "B", "C"],
        ["D", "E", "F"],
      ]);
    });

    it("infers object records with `columns: true`", async function () {
      const stream = parseStream({ columns: true });
      const writer = stream.writable.getWriter();
      await writer.write("名称,数量\n螺丝,3\n");
      await writer.close();
      const records: Record<string, string>[] = [];
      for await (const record of stream.readable) {
        // Property access without manual assertion
        record.名称;
        records.push(record);
      }
      records.should.eql([{ 名称: "螺丝", 数量: "3" }]);
    });

    it("infers object records from named columns", async function () {
      const stream = parseStream({ columns: ["name", "count"] });
      const writer = stream.writable.getWriter();
      await writer.write("螺丝,3\n");
      await writer.close();
      for await (const record of stream.readable) {
        const name: string = record.name;
        const count: string = record.count;
        name.should.eql("螺丝");
        count.should.eql("3");
      }
    });
  });
});
