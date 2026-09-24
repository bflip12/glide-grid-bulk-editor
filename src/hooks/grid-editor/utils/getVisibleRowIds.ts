import type { ColumnFilterT, ColumnT, RowIdT } from "../gridEditor.types";

const hasValue = (value: string | undefined) => value !== undefined && value !== "";

/**
 * Returns the row IDs that pass every active column filter, in their original order.
 *
 * With no active filter the input array is returned as-is, so a memoised caller keeps the
 * same reference and the grid does not redraw for nothing.
 */
export const getVisibleRowIds = (
  rowIds: RowIdT[],
  columns: ColumnT[],
  filters: Record<string, ColumnFilterT>
): RowIdT[] => {
  const active = columns.filter((column) => (filters[column.id] ?? "all") !== "all");
  if (active.length === 0) return rowIds;

  return rowIds.filter((rowId) =>
    active.every((column) =>
      filters[column.id] === "hasValue"
        ? hasValue(column.values[rowId])
        : !hasValue(column.values[rowId])
    )
  );
};
