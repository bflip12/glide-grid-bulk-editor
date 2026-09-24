import { useCallback, useMemo } from "react";
import { GridCellKind } from "@glideapps/glide-data-grid";
import type { DataEditorProps, GridCell, GridColumn, Item } from "@glideapps/glide-data-grid";

import type { CellChangeT, GridColorsT, UseGlideGridPropsParamsT } from "./gridEditor.types";
import { useGridEditor } from "./GridEditorContext";
import {
  DEFAULT_MAX_PAYLOAD_BYTES,
  estimatePayloadBytes,
  formatMegabytes
} from "./utils/estimatePayloadBytes";
import { getPasteChanges } from "./utils/getPasteChanges";

export const ID_COLUMN_KEY = "__row-id";

export const DEFAULT_GRID_COLORS: GridColorsT = {
  idCellBg: "#f5f5f4",
  idCellText: "#78716c",
  changedCellBg: "#fef3c7",
  newColumnHeaderBg: "#bae6fd",
  newColumnCellBg: "#f0f9ff",
  filteredHeaderBg: "#bbf7d0"
};

type PasteHandlerT = (target: Item, values: readonly (readonly string[])[]) => boolean;

type GlideGridPropsT = Required<
  Pick<DataEditorProps, "columns" | "rows" | "getCellContent" | "onCellsEdited">
> & { onPaste: PasteHandlerT };

/**
 * Connects the editor state to Glide's DataEditor.
 *
 * Glide asks for cells by position. Row N on screen is `visibleRowIds[N]`, so every read and
 * write goes through the row ID and stays correct when filters change which rows are shown.
 * Column 0 is the read-only ID column; data column `i` is grid column `i + 1`.
 */
export const useGlideGridProps = ({
  colors: colorOverrides,
  maxPayloadBytes = DEFAULT_MAX_PAYLOAD_BYTES,
  onPasteRejected,
  onHeaderRowSkipped
}: UseGlideGridPropsParamsT = {}): GlideGridPropsT => {
  const { state, dispatch, visibleRowIds } = useGridEditor();
  const { columns, changes, filters, idColumnTitle } = state;

  const colors = useMemo(() => ({ ...DEFAULT_GRID_COLORS, ...colorOverrides }), [colorOverrides]);

  const gridColumns = useMemo<GridColumn[]>(
    () => [
      { id: ID_COLUMN_KEY, title: idColumnTitle, width: 140 },
      ...columns.map((column) => {
        const isFiltered = (filters[column.id] ?? "all") !== "all";
        const headerBg = column.isNew
          ? colors.newColumnHeaderBg
          : isFiltered
            ? colors.filteredHeaderBg
            : undefined;
        return {
          id: column.id,
          title: column.title,
          width: 130,
          hasMenu: true,
          themeOverride: headerBg ? { bgHeader: headerBg, bgHeaderHovered: headerBg } : undefined
        };
      })
    ],
    [colors, columns, filters, idColumnTitle]
  );

  const getCellContent = useCallback(
    ([col, row]: Item): GridCell => {
      const rowId = visibleRowIds[row] ?? "";

      if (col === 0) {
        return {
          kind: GridCellKind.Text,
          data: rowId,
          displayData: rowId,
          allowOverlay: false,
          readonly: true,
          themeOverride: { bgCell: colors.idCellBg, textDark: colors.idCellText }
        };
      }

      const column = columns[col - 1];
      const value = column?.values[rowId] ?? "";
      const isChanged = column ? changes.get(column.id)?.has(rowId) === true : false;
      const cellBg = isChanged
        ? colors.changedCellBg
        : column?.isNew
          ? colors.newColumnCellBg
          : undefined;

      return {
        kind: GridCellKind.Text,
        data: value,
        displayData: value,
        allowOverlay: true,
        themeOverride: cellBg ? { bgCell: cellBg } : undefined
      };
    },
    [changes, colors, columns, visibleRowIds]
  );

  const onCellsEdited = useCallback<GlideGridPropsT["onCellsEdited"]>(
    (edits) => {
      const cellChanges: CellChangeT[] = [];
      for (const { location, value } of edits) {
        const [col, row] = location;
        const column = columns[col - 1];
        const rowId = visibleRowIds[row];
        if (col === 0 || !column || rowId === undefined) continue;
        if (value.kind !== GridCellKind.Text) continue;
        cellChanges.push({ columnId: column.id, rowId, value: value.data });
      }
      dispatch({ type: "applyChanges", changes: cellChanges });
      // True tells Glide the edits are handled, so it does not call onCellEdited per cell.
      return true;
    },
    [columns, dispatch, visibleRowIds]
  );

  const onPaste = useCallback<PasteHandlerT>(
    (target, values) => {
      const { changes: pasted, isHeaderRowSkipped } = getPasteChanges({
        target,
        values,
        visibleRowIds,
        idColumnTitle,
        columns
      });
      if (pasted.length === 0) return false;

      const bytes = estimatePayloadBytes(pasted);
      if (bytes > maxPayloadBytes) {
        onPasteRejected?.(
          `This paste is ${formatMegabytes(bytes)}, over the ${formatMegabytes(maxPayloadBytes)} limit. Paste a smaller range.`
        );
        return false;
      }

      dispatch({ type: "applyChanges", changes: pasted });
      if (isHeaderRowSkipped) onHeaderRowSkipped?.();
      // False tells Glide not to apply the paste itself. It has already been applied above.
      return false;
    },
    [columns, dispatch, idColumnTitle, maxPayloadBytes, onHeaderRowSkipped, onPasteRejected, visibleRowIds]
  );

  return {
    columns: gridColumns,
    rows: visibleRowIds.length,
    getCellContent,
    onCellsEdited,
    onPaste
  };
};
