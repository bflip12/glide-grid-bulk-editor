import { describe, expect, it } from "vitest";

import { createFixture } from "../../../test/fixtures";
import { getPasteChanges } from "./getPasteChanges";

const { rowIds, columns, idColumnTitle } = createFixture();
const paste = (target: [number, number], values: string[][], visibleRowIds = rowIds) =>
  getPasteChanges({ target, values, visibleRowIds, idColumnTitle, columns });

describe("getPasteChanges", () => {
  it("maps each pasted cell to a column ID and row ID", () => {
    const { changes } = paste([1, 1], [["20", "Active"], ["21", "Paused"]]);

    expect(changes).toEqual([
      { columnId: "depth", rowId: "Site B", value: "20" },
      { columnId: "status", rowId: "Site B", value: "Active" },
      { columnId: "depth", rowId: "Site C", value: "21" },
      { columnId: "status", rowId: "Site C", value: "Paused" }
    ]);
  });

  it("drops values that land on the ID column without shifting the rest", () => {
    const { changes } = paste([0, 0], [["Site X", "11", "Paused"]]);

    expect(changes).toEqual([
      { columnId: "depth", rowId: "Site A", value: "11" },
      { columnId: "status", rowId: "Site A", value: "Paused" }
    ]);
  });

  it("drops rows past the last visible row and columns past the last column", () => {
    const { changes } = paste([2, 3], [["Done", "extra"], ["Lost"]]);

    expect(changes).toEqual([{ columnId: "status", rowId: "Site D", value: "Done" }]);
  });

  it("writes to the visible rows when the grid is filtered", () => {
    // Filtered to rows without a depth: row 0 on screen is Site B, row 1 is Site D.
    const { changes } = paste([1, 0], [["5"], ["6"]], ["Site B", "Site D"]);

    expect(changes).toEqual([
      { columnId: "depth", rowId: "Site B", value: "5" },
      { columnId: "depth", rowId: "Site D", value: "6" }
    ]);
  });

  it("skips a header row pasted at the top of a column", () => {
    const result = paste([1, 0], [["Depth"], ["12"], ["13"]]);

    expect(result.isHeaderRowSkipped).toBe(true);
    expect(result.changes).toEqual([
      { columnId: "depth", rowId: "Site A", value: "12" },
      { columnId: "depth", rowId: "Site B", value: "13" }
    ]);
  });

  it("skips a header row that includes the ID column", () => {
    const result = paste([0, 0], [["Site", "Depth"], ["Site A", "12"]]);

    expect(result.isHeaderRowSkipped).toBe(true);
    expect(result.changes).toEqual([{ columnId: "depth", rowId: "Site A", value: "12" }]);
  });

  it("keeps the first row when it is data", () => {
    const result = paste([1, 0], [["12"], ["13"]]);

    expect(result.isHeaderRowSkipped).toBe(false);
    expect(result.changes[0]).toEqual({ columnId: "depth", rowId: "Site A", value: "12" });
  });

  it("keeps a title-like first row when the paste does not start at the top", () => {
    const result = paste([1, 2], [["Depth"], ["13"]]);

    expect(result.isHeaderRowSkipped).toBe(false);
    expect(result.changes[0]).toEqual({ columnId: "depth", rowId: "Site C", value: "Depth" });
  });

  it("keeps a single pasted cell even if it matches a title", () => {
    const result = paste([1, 0], [["Depth"]]);

    expect(result.isHeaderRowSkipped).toBe(false);
    expect(result.changes).toHaveLength(1);
  });
});
