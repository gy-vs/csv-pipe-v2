import "should";
import { generate as generateStream } from "csv-generate/stream";
import { parse as parseStream } from "../lib/stream.js";
import { parse as parseClassic } from "../lib/index.js";

const collect = async (stream) => {
  const records = [];
  for await (const record of stream) {
    records.push(record);
  }
  return records;
};

// Feed `chunks` to the Node Parser, same chunks one by one.
const collectClassic = (chunks, opts) =>
  new Promise((resolve, reject) => {
    const records = [];
    const parser = opts === undefined ? parseClassic() : parseClassic(opts);
    parser.on("data", (record) => records.push(record));
    parser.on("error", reject);
    parser.on("end", () => resolve(records));
    for (const chunk of chunks) parser.write(chunk);
    parser.end();
  });

describe("api stream", function () {
  it.skip("perf classic", async function () {
    console.time("classic");
    // TODO: implement
    const generateClassic = () => {};
    const generator = generateClassic({
      objectMode: true,
      length: 10000000,
    });
    for await (const record of generator) {
      record;
      continue;
    }
    console.timeEnd("classic");
  });

  it.skip("perf stream", async function () {
    console.time("stream");
    const generator = generateStream({
      objectMode: true,
      length: 10000000,
    });
    const reader = generator.getReader();
    while (true) {
      const { done, value } = await reader.read();
      value;
      if (done) break;
    }
    // for await (const chunk of generator.getReader().read()) {
    //   console.log(Buffer.from(chunk).toString());
    // }
    console.timeEnd("stream");
  });

  it("perf stream with iterator", async function () {
    const generator = generateStream({
      objectMode: false,
      length: 5,
    });
    const parser = parseStream();
    const stream = generator.pipeThrough(parser);
    const records = [];
    for await (const record of stream) {
      records.push(record);
    }
    records.length.should.eql(5);
  });

  it("parses string chunks, like the Node stream", async function () {
    const chunks = ["a,b\n", "1,2\n"];
    (
      await collect(ReadableStream.from(chunks).pipeThrough(parseStream()))
    ).should.eql([
      ["a", "b"],
      ["1", "2"],
    ]);
    (
      await collect(ReadableStream.from(chunks).pipeThrough(parseStream()))
    ).should.eql(await collectClassic(chunks));
  });

  it("parses multibyte content in string chunks", async function () {
    const chunks = ["名称,数量\n", "螺丝,3\n"];
    (
      await collect(
        ReadableStream.from(chunks).pipeThrough(parseStream({ columns: true })),
      )
    ).should.eql([{ 名称: "螺丝", 数量: "3" }]);
  });

  it("parses multibyte content split across byte chunks", async function () {
    const bytes = Buffer.from("名称,数量\n螺丝,3\n");
    for (const size of [1, 2, 3, 4, 5]) {
      const chunks = [];
      for (let i = 0; i < bytes.length; i += size) {
        chunks.push(bytes.subarray(i, i + size));
      }
      (
        await collect(ReadableStream.from(chunks).pipeThrough(parseStream()))
      ).should.eql([
        ["名称", "数量"],
        ["螺丝", "3"],
      ]);
    }
  });

  it("parses strings emitted by TextDecoderStream", async function () {
    const body = new Response("名称,数量\n螺丝,3\n").body;
    (
      await collect(
        body
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(parseStream({ columns: true })),
      )
    ).should.eql([{ 名称: "螺丝", 数量: "3" }]);
  });

  it("propagates parsing errors with string chunks", async function () {
    await collect(
      ReadableStream.from(["a,b\n", "c\n"]).pipeThrough(parseStream()),
    ).should.be.rejectedWith({
      code: "CSV_RECORD_INCONSISTENT_FIELDS_LENGTH",
    });
  });

  // it('perf stream with reader', async function() {
  //   const generator = generateStream({
  //     objectMode: true,
  //     length: 10
  //   });
  //   const records = [];
  //   const reader = generator.getReader();
  //   while (true) {
  //     const { done, record } = await reader.read();
  //     if (done) break;
  //     records.push(record);
  //   }
  //   records.length.should.eql(10);
  // });
});
