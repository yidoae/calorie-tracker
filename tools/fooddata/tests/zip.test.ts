import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deflateRawSync } from "node:zlib";
import { csvRows, readZipMember } from "../src/zip.ts";

/** A one-member zip built by hand, enough to check the reader against the format. */
function zipOf(name: string, content: string): Buffer {
  const data = deflateRawSync(Buffer.from(content));
  const n = Buffer.from(name);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(8, 8);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(content.length, 22);
  local.writeUInt16LE(n.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(content.length, 24);
  central.writeUInt16LE(n.length, 28);
  central.writeUInt32LE(0, 42);
  const cdOffset = local.length + n.length + data.length;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(central.length + n.length, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  return Buffer.concat([local, n, data, central, n, eocd]);
}

describe("zip and csv", () => {
  it("reads a deflated member by the end of its name", () => {
    const zip = zipOf("FoodData/food.csv", '"fdc_id","description"\n"1","Egg"\n');
    assert.equal(readZipMember(zip, "/food.csv").toString(), '"fdc_id","description"\n"1","Egg"\n');
    assert.throws(() => readZipMember(zip, "/nutrient.csv"), /no member/);
  });

  it("parses quoted fields with commas, doubled quotes, newlines and CRLF", () => {
    const rows = [...csvRows('"a","b, c"\r\n"say ""hi""","x\ny"\n')];
    assert.deepEqual(rows, [["a", "b, c"], ['say "hi"', "x\ny"]]);
  });
});
