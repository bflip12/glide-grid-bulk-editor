import type { ColumnT, ColumnTitleValidationT } from "../gridEditor.types";

/**
 * Checks a new column's title before it is added: it must not be empty after trimming, and
 * no column in the grid may already have it. The comparison is case-sensitive, as in the
 * app this is based on.
 */
export const validateColumnTitle = (title: string, columns: ColumnT[]): ColumnTitleValidationT => {
  const trimmed = title.trim();

  if (trimmed === "") return { isValid: false, error: "Column name is required" };
  if (columns.some((column) => column.title === trimmed)) {
    return { isValid: false, error: `Column "${trimmed}" already exists` };
  }

  return { isValid: true };
};
