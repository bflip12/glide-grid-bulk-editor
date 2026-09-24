import { describe, expect, it } from "vitest";

import { createFixture } from "../../../test/fixtures";
import { validateColumnTitle } from "./validateColumnTitle";

const { columns } = createFixture();

describe("validateColumnTitle", () => {
  it("accepts a new title", () => {
    expect(validateColumnTitle("Owner", columns)).toEqual({ isValid: true });
  });

  it("requires a title", () => {
    expect(validateColumnTitle("   ", columns)).toEqual({
      isValid: false,
      error: "Column name is required"
    });
  });

  it("rejects a title that already exists, after trimming", () => {
    expect(validateColumnTitle(" Depth ", columns)).toEqual({
      isValid: false,
      error: 'Column "Depth" already exists'
    });
  });

  it("compares titles case-sensitively", () => {
    expect(validateColumnTitle("depth", columns)).toEqual({ isValid: true });
  });
});
