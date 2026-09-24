import { describe, expect, it } from "vitest";

import { createFixture } from "../../../test/fixtures";
import type { ChangeMapT, ColumnT } from "../gridEditor.types";
import { buildSaveRequest } from "./buildSaveRequest";
import { countChanges } from "./countChanges";
import { estimatePayloadBytes } from "./estimatePayloadBytes";

const { columns } = createFixture();
const newColumn: ColumnT = { id: "new:Owner", title: "Owner", values: { "Site A": "Kim" }, isNew: true };

describe("buildSaveRequest", () => {
  it("lists new columns and every changed cell once", () => {
    const changes: ChangeMapT = new Map([
      ["depth", new Map([["Site B", "20"]])],
      ["new:Owner", new Map([["Site A", "Kim"]])]
    ]);

    expect(buildSaveRequest([...columns, newColumn], changes)).toEqual({
      newColumns: [{ id: "new:Owner", title: "Owner" }],
      updates: [
        { columnId: "depth", rowId: "Site B", value: "20" },
        { columnId: "new:Owner", rowId: "Site A", value: "Kim" }
      ]
    });
  });

  it("is empty when nothing changed", () => {
    expect(buildSaveRequest(columns, new Map())).toEqual({ newColumns: [], updates: [] });
  });
});

describe("countChanges", () => {
  it("counts changed cells across columns", () => {
    const changes: ChangeMapT = new Map([
      ["depth", new Map([["Site B", "20"], ["Site D", "1"]])],
      ["status", new Map([["Site C", "Active"]])]
    ]);

    expect(countChanges(changes)).toBe(3);
  });
});

describe("estimatePayloadBytes", () => {
  it("counts UTF-8 bytes of the JSON", () => {
    expect(estimatePayloadBytes({ a: "é" })).toBe('{"a":"é"}'.length + 1);
  });
});
