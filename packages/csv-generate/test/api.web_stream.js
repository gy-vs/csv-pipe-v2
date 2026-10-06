import "should";
import { generate as generateStream } from "../lib/stream.js";
import { generate as generateClassic } from "../lib/index.js";

describe("api stream", function () {
  it.skip("perf classic", async function () {
    console.time("classic");
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
      const { done } = await reader.read();
      if (done) break;
    }
    console.timeEnd("classic");
  });

  it("perf stream with iterator", async function () {
    const generator = generateStream({
      objectMode: true,
      length: 10,
    });
    const records = [];
    for await (const record of generator) {
      records.push(record);
    }
    records.length.should.eql(10);
  });

  it("perf stream with reader", async function () {
    const generator = generateStream({
      objectMode: true,
      length: 10,
    });
    const records = [];
    const reader = generator.getReader();
    while (true) {
      const { done, record } = await reader.read();
      if (done) break;
      records.push(record);
    }
    records.length.should.eql(10);
  });

  describe("parity with the Node.js stream", function () {
    const collect = async (stream) => {
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return chunks;
    };

    it("emits records in objectMode", async function () {
      const records = await collect(
        generateStream({ length: 2, columns: 2, seed: 1, objectMode: true }),
      );
      records.should.eql([
        ["OMH", "ONKCHhJmjadoA"],
        ["D", "GeACHiN"],
      ]);
      records.forEach((record) => {
        record.should.be.an.Array();
        Buffer.isBuffer(record).should.be.false();
      });
    });

    it("emits strings when encoding is defined", async function () {
      const chunks = await collect(
        generateStream({
          length: 2,
          columns: 2,
          seed: 1,
          encoding: "utf8",
        }),
      );
      chunks.forEach((chunk) => {
        chunk.should.be.a.String();
      });
      chunks.join("").should.eql("OMH,ONKCHhJmjadoA\nD,GeACHiN");
    });

    it("emits buffers by default", async function () {
      const chunks = await collect(
        generateStream({ length: 2, columns: 2, seed: 1 }),
      );
      chunks.forEach((chunk) => {
        Buffer.isBuffer(chunk).should.be.true();
      });
      Buffer.concat(chunks)
        .toString()
        .should.eql("OMH,ONKCHhJmjadoA\nD,GeACHiN");
    });

    it("generates the same content as the Node.js stream", async function () {
      const options = { length: 100, columns: 3, seed: 1 };
      const webChunks = await collect(generateStream(options));
      const nodeChunks = [];
      for await (const chunk of generateClassic(options)) {
        nodeChunks.push(chunk);
      }
      Buffer.concat(webChunks)
        .equals(Buffer.concat(nodeChunks))
        .should.be.true();
    });
  });
});
