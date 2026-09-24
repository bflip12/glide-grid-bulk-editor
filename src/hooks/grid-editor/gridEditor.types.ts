import type { Dispatch } from "react";

/** A stable row identifier. Edits are keyed by this, never by the row's position on screen. */
export type RowIdT = string;

export type ColumnT = {
  id: string;
  title: string;
  /** Cell values keyed by row ID. A missing key means an empty cell. */
  values: Record<RowIdT, string>;
  /** True for a column added in the editor and not saved yet. */
  isNew?: boolean;
};

/** What the editor loads: the ID column's title, every row ID in order, and the data columns. */
export type GridDataT = {
  idColumnTitle: string;
  rowIds: RowIdT[];
  columns: ColumnT[];
};

export type CellChangeT = {
  columnId: string;
  rowId: RowIdT;
  value: string;
};

/**
 * Pending edits: column ID -> row ID -> new value. Each cell has at most one entry, however
 * many times it is edited, so the save request never repeats a cell.
 */
export type ChangeMapT = Map<string, Map<RowIdT, string>>;

export type ColumnFilterT = "all" | "hasValue" | "noValue";

export type GridEditorStateT = GridDataT & {
  /** Values as last saved. Used to drop an edit that puts a cell back to its saved value. */
  savedColumns: ColumnT[];
  changes: ChangeMapT;
  filters: Record<string, ColumnFilterT>;
};

export type GridEditorActionT =
  | { type: "load"; data: GridDataT }
  | { type: "applyChanges"; changes: CellChangeT[] }
  | { type: "addColumn"; title: string }
  | { type: "removeColumn"; columnId: string }
  | { type: "setFilter"; columnId: string; filter: ColumnFilterT }
  | { type: "saved"; request: SaveRequestT };

export type SaveRequestT = {
  newColumns: { id: string; title: string }[];
  updates: CellChangeT[];
};

export type GridEditorContextValueT = {
  state: GridEditorStateT;
  dispatch: Dispatch<GridEditorActionT>;
  /** Row IDs that pass the active filters, in display order. Row index N on screen is visibleRowIds[N]. */
  visibleRowIds: RowIdT[];
  changeCount: number;
  hasChanges: boolean;
  saveRequest: SaveRequestT;
};

export type ColumnTitleValidationT = { isValid: true } | { isValid: false; error: string };

export type GetPasteChangesParamsT = {
  /** Where the paste starts, in grid coordinates: column 0 is the read-only ID column. */
  target: readonly [number, number];
  /** Pasted text as rows of cells, as Glide's onPaste passes it. */
  values: readonly (readonly string[])[];
  visibleRowIds: RowIdT[];
  idColumnTitle: string;
  columns: ColumnT[];
};

export type GetPasteChangesReturnT = {
  changes: CellChangeT[];
  isHeaderRowSkipped: boolean;
};

export type UseGridSaveParamsT = {
  onSave: (request: SaveRequestT) => Promise<void>;
  maxPayloadBytes?: number;
};

export type UseGridSaveReturnT = {
  save: () => Promise<boolean>;
  isSaving: boolean;
  error: string | null;
  clearError: () => void;
};

/** Colours the grid uses to mark state. Canvas cannot read CSS variables, so pass real colours. */
export type GridColorsT = {
  idCellBg: string;
  idCellText: string;
  changedCellBg: string;
  newColumnHeaderBg: string;
  newColumnCellBg: string;
  filteredHeaderBg: string;
};

export type UseGlideGridPropsParamsT = {
  colors?: Partial<GridColorsT>;
  maxPayloadBytes?: number;
  /** Called when a paste is rejected, with a message for the user. */
  onPasteRejected?: (message: string) => void;
  /** Called after a paste whose first row was taken as a header row and skipped. */
  onHeaderRowSkipped?: () => void;
};

export type UseGridKeyboardParamsT = {
  /** Turn off while another layer (such as a confirmation prompt) owns the keyboard. */
  isEnabled: boolean;
  hasSelection: boolean;
  onClearSelection: () => void;
  /** Called when Escape is pressed and nothing inside the grid is open. */
  onEscapeWhenIdle?: () => void;
  /** Glide renders its cell editor into the element with this ID. */
  portalId?: string;
};

export type UseGridKeyboardReturnT = {
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
};
