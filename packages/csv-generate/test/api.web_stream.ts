import "should";
import { generate } from "../lib/stream.js";

describe("API Web Stream Types", function () {
  it("yields record arrays in object mode", async function () {
    const stream = generate({
      length: 2,
      columns: 2,
      seed: 1,
      objectMode: true,
    });
    for await (const record of stream) {
      // No manual assertion expected
      const values: (string | number | null)[] = record;
      values.should.be.an.Array();
    }
  });

  it("yields strings with `encoding`", async function () {
    const stream = generate({
      length: 2,
      columns: 2,
      seed: 1,
      encoding: "utf8",
    });
    for await (const chunk of stream) {
      const value: string = chunk;
      value.should.be.a.String();
    }
  });

  it("yields buffers by default", async function () {
    const stream = generate({ length: 2, columns: 2, seed: 1 });
    for await (const chunk of stream) {
      // No manual assertion expected
      Buffer.isBuffer(chunk).should.be.true();
    }
  });

  it("yields record arrays in underscored object mode", async function () {
    const stream = generate({ length: 1, columns: 2, object_mode: true });
    for await (const record of stream) {
      const values: (string | number | null)[] = record;
      values.should.be.an.Array();
    }
  });
});
