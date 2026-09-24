import type { ChangeMapT, ColumnT, SaveRequestT } from "../gridEditor.types";

/**
 * Builds the one request that saves everything: the columns to create, then every changed
 * cell. Cells in new columns are ordinary entries in the change map, so each cell appears
 * exactly once.
 */
export const buildSaveRequest = (columns: ColumnT[], changes: ChangeMapT): SaveRequestT => {
  const newColumns = columns
    .filter((column) => column.isNew)
    .map(({ id, title }) => ({ id, title }));

  const updates: SaveRequestT["updates"] = [];
  changes.forEach((rows, columnId) => {
    rows.forEach((value, rowId) => updates.push({ columnId, rowId, value }));
  });

  return { newColumns, updates };
};
