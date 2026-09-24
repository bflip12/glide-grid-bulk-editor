import { describe, expect, it } from "vitest";

import { isHeaderRow } from "./isHeaderRow";

const TITLES = ["Site", "Depth", "Status"];

describe("isHeaderRow", () => {
  it("matches the titles of the columns the row lands on", () => {
    expect(isHeaderRow(["Depth", "Status"], TITLES, 1)).toBe(true);
  });

  it("ignores case and surrounding spaces", () => {
    expect(isHeaderRow([" depth "], TITLES, 1)).toBe(true);
  });

  it("does not match a data row", () => {
    expect(isHeaderRow(["12", "Active"], TITLES, 1)).toBe(false);
  });

  it("does not match a title that belongs to a different column", () => {
    expect(isHeaderRow(["Status"], TITLES, 1)).toBe(false);
  });

  it("does not match an empty row", () => {
    expect(isHeaderRow(["", " "], TITLES, 1)).toBe(false);
  });

  it("does not match cells that land past the last column", () => {
    expect(isHeaderRow(["Status", "Extra"], TITLES, 2)).toBe(false);
  });
});
