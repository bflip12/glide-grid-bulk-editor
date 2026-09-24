import { describe, expect, it } from "vitest";

import { createFixture } from "../../../test/fixtures";
import { getVisibleRowIds } from "./getVisibleRowIds";

const { rowIds, columns } = createFixture();

describe("getVisibleRowIds", () => {
  it("returns the same array when no filter is active", () => {
    expect(getVisibleRowIds(rowIds, columns, {})).toBe(rowIds);
    expect(getVisibleRowIds(rowIds, columns, { depth: "all" })).toBe(rowIds);
  });

  it("keeps rows with a value", () => {
    expect(getVisibleRowIds(rowIds, columns, { depth: "hasValue" })).toEqual(["Site A", "Site C"]);
  });

  it("keeps rows without a value", () => {
    expect(getVisibleRowIds(rowIds, columns, { depth: "noValue" })).toEqual(["Site B", "Site D"]);
  });

  it("requires every active filter to pass", () => {
    expect(getVisibleRowIds(rowIds, columns, { depth: "noValue", status: "hasValue" })).toEqual([
      "Site B"
    ]);
  });

  it("ignores filters for columns that no longer exist", () => {
    expect(getVisibleRowIds(rowIds, columns, { removed: "hasValue" })).toBe(rowIds);
  });
});
