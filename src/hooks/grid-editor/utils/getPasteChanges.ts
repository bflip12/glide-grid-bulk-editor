import type { CellChangeT, GetPasteChangesParamsT, GetPasteChangesReturnT } from "../gridEditor.types";
import { isHeaderRow } from "./isHeaderRow";

/**
 * Turns a paste into cell changes keyed by row ID.
 *
 * - Grid column 0 is the read-only ID column. A value that lands on it is dropped, and the
 *   values after it keep their columns.
 * - Row N of the paste lands on the Nth visible row after the target, so a paste into a
 *   filtered grid writes to the rows the user can see.
 * - Values past the last visible row or the last column are dropped.
 * - When the paste starts at the top row and its first row repeats the column titles, that
 *   row is treated as a header and skipped.
 */
export const getPasteChanges = ({
  target,
  values,
  visibleRowIds,
  idColumnTitle,
  columns
}: GetPasteChangesParamsT): GetPasteChangesReturnT => {
  const [targetCol, targetRow] = target;
  const gridTitles = [idColumnTitle, ...columns.map((column) => column.title)];

  const isHeaderRowSkipped =
    targetRow === 0 && values.length > 1 && isHeaderRow(values[0], gridTitles, targetCol);
  const firstDataRow = isHeaderRowSkipped ? 1 : 0;

  const changes: CellChangeT[] = [];

  for (let pasteRow = firstDataRow; pasteRow < values.length; pasteRow++) {
    const rowId = visibleRowIds[targetRow + pasteRow - firstDataRow];
    if (rowId === undefined) break;

    values[pasteRow].forEach((value, offset) => {
      const gridCol = targetCol + offset;
      if (gridCol === 0) return; // read-only ID column

      const column = columns[gridCol - 1];
      if (!column) return;

      changes.push({ columnId: column.id, rowId, value });
    });
  }

  return { changes, isHeaderRowSkipped };
};
