import type { ChangeMapT } from "../gridEditor.types";

/** Number of changed cells across all columns. */
export const countChanges = (changes: ChangeMapT): number => {
  let count = 0;
  changes.forEach((rows) => (count += rows.size));
  return count;
};
