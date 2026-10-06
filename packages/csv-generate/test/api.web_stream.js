import "should";
import { generate as generateStream } from "../lib/stream.js";
import { generate as generateClassic } from "../lib/index.js";

// Collect every chunk of a Web ReadableStream.
const collect = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return chunks;
};

// Collect every record/chunk of a Node Readable.
const collectClassic = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(chunks));
  });

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
    // for await (const chunk of generator.getReader().read()) {
    //   console.log(Buffer.from(chunk).toString());
    // }
    console.timeEnd("stream");
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

  it("emits records in object mode, like the Node stream", async function () {
    const opts = { length: 2, columns: 2, seed: 1, objectMode: true };
    (await collect(generateStream(opts))).should.eql(
      await collectClassic(generateClassic(opts)),
    );
    (await collect(generateStream(opts))).should.eql([
      ["OMH", "ONKCHhJmjadoA"],
      ["D", "GeACHiN"],
    ]);
  });

  it("object mode takes precedence over encoding", async function () {
    const chunks = await collect(
      generateStream({
        length: 2,
        columns: 2,
        seed: 1,
        objectMode: true,
        encoding: "utf8",
      }),
    );
    chunks.should.eql([
      ["OMH", "ONKCHhJmjadoA"],
      ["D", "GeACHiN"],
    ]);
    chunks[0].should.be.an.Array();
  });

  it("emits buffers by default", async function () {
    const chunks = await collect(
      generateStream({ length: 2, columns: 2, seed: 1 }),
    );
    chunks.length.should.eql(1);
    Buffer.isBuffer(chunks[0]).should.be.true();
    chunks[0].toString().should.eql("OMH,ONKCHhJmjadoA\nD,GeACHiN");
  });

  it("emits strings when `encoding` is set", async function () {
    const chunks = await collect(
      generateStream({ length: 2, columns: 2, seed: 1, encoding: "utf8" }),
    );
    chunks.should.eql(["OMH,ONKCHhJmjadoA\nD,GeACHiN"]);
  });

  it("honors the `object_mode` underscored option", async function () {
    const chunks = await collect(
      generateStream({ length: 1, columns: 2, seed: 1, object_mode: true }),
    );
    chunks[0].should.be.an.Array();
  });
});
