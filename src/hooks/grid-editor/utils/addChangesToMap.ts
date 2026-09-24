import type { CellChangeT, ChangeMapT, ColumnT } from "../gridEditor.types";

/**
 * Records cell changes in the change map and returns a new map.
 *
 * Each cell keeps one entry, so editing a cell twice leaves only the latest value. A change
 * that puts a cell back to its saved value removes the entry instead, so undoing an edit by
 * hand does not leave a pending change behind.
 *
 * Inner maps are copied at most once per call, which keeps a 25,000-cell paste from
 * copying the same column map thousands of times.
 */
export const addChangesToMap = (
  current: ChangeMapT,
  changes: CellChangeT[],
  savedColumns: ColumnT[]
): ChangeMapT => {
  const next = new Map(current);
  const copied = new Set<string>();
  const savedById = new Map(savedColumns.map((column) => [column.id, column.values]));

  for (const { columnId, rowId, value } of changes) {
    if (!copied.has(columnId)) {
      next.set(columnId, new Map(next.get(columnId)));
      copied.add(columnId);
    }
    const columnChanges = next.get(columnId)!;
    const savedValue = savedById.get(columnId)?.[rowId] ?? "";

    if (value === savedValue) columnChanges.delete(rowId);
    else columnChanges.set(rowId, value);
  }

  // Drop columns left with no changes, so the map's size is the number of changed columns.
  copied.forEach((columnId) => {
    if (next.get(columnId)?.size === 0) next.delete(columnId);
  });

  return next;
};
