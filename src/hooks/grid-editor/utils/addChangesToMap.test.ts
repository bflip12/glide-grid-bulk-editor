import { describe, expect, it } from "vitest";

import { createFixture } from "../../../test/fixtures";
import type { ChangeMapT } from "../gridEditor.types";
import { addChangesToMap } from "./addChangesToMap";

const { columns } = createFixture();
const entries = (map: ChangeMapT) =>
  [...map].map(([columnId, rows]) => [columnId, Object.fromEntries(rows)]);

describe("addChangesToMap", () => {
  it("records a change under its column and row ID", () => {
    const next = addChangesToMap(new Map(), [{ columnId: "depth", rowId: "Site B", value: "20" }], columns);

    expect(entries(next)).toEqual([["depth", { "Site B": "20" }]]);
  });

  it("keeps one entry per cell, with the latest value", () => {
    const next = addChangesToMap(
      new Map(),
      [
        { columnId: "depth", rowId: "Site B", value: "20" },
        { columnId: "depth", rowId: "Site B", value: "25" }
      ],
      columns
    );

    expect(entries(next)).toEqual([["depth", { "Site B": "25" }]]);
  });

  it("removes the entry when a cell is set back to its saved value", () => {
    const first = addChangesToMap(new Map(), [{ columnId: "depth", rowId: "Site A", value: "11" }], columns);
    const reverted = addChangesToMap(first, [{ columnId: "depth", rowId: "Site A", value: "10" }], columns);

    expect(reverted.size).toBe(0);
  });

  it("treats clearing an empty cell as no change", () => {
    const next = addChangesToMap(new Map(), [{ columnId: "depth", rowId: "Site D", value: "" }], columns);

    expect(next.size).toBe(0);
  });

  it("handles a column emptied and changed again in the same call", () => {
    const next = addChangesToMap(
      new Map(),
      [
        { columnId: "depth", rowId: "Site A", value: "10" },
        { columnId: "depth", rowId: "Site B", value: "5" }
      ],
      columns
    );

    expect(entries(next)).toEqual([["depth", { "Site B": "5" }]]);
  });

  it("does not modify the map it was given", () => {
    const current: ChangeMapT = new Map([["depth", new Map([["Site B", "20"]])]]);
    addChangesToMap(current, [{ columnId: "depth", rowId: "Site C", value: "31" }], columns);

    expect(entries(current)).toEqual([["depth", { "Site B": "20" }]]);
  });
});
