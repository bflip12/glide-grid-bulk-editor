import { useCallback, useEffect, useRef, useState } from "react";
import { CompactSelection, DataEditor } from "@glideapps/glide-data-grid";
import type { DataEditorRef, GridSelection, Theme } from "@glideapps/glide-data-grid";

import type { ColumnT, GridColorsT, SaveRequestT } from "../../hooks/grid-editor/gridEditor.types";
import { useGridEditor } from "../../hooks/grid-editor/GridEditorContext";
import { useGlideGridProps } from "../../hooks/grid-editor/useGlideGridProps";
import { useGridKeyboard } from "../../hooks/grid-editor/useGridKeyboard";
import { useGridSave } from "../../hooks/grid-editor/useGridSave";
import { AddColumnForm } from "./AddColumnForm";
import { ColumnMenu } from "./ColumnMenu";

const EMPTY_SELECTION: GridSelection = {
  columns: CompactSelection.empty(),
  rows: CompactSelection.empty()
};

type GridEditorPropsT = {
  height: number;
  onSave: (request: SaveRequestT) => Promise<void>;
  /** Called when Escape is pressed with nothing open in the grid. */
  onRequestClose?: () => void;
  /** Set to false while something above the editor, such as a prompt, owns the keyboard. */
  isKeyboardEnabled?: boolean;
  colors?: Partial<GridColorsT>;
  theme?: Partial<Theme>;
  maxPayloadBytes?: number;
};

/** The grid, with a toolbar for adding columns, searching and saving, and a change count. */
export const GridEditor = ({
  height,
  onSave,
  onRequestClose,
  isKeyboardEnabled = true,
  colors,
  theme,
  maxPayloadBytes
}: GridEditorPropsT) => {
  const { state, changeCount, hasChanges } = useGridEditor();
  const gridRef = useRef<DataEditorRef>(null);
  const [selection, setSelection] = useState<GridSelection>(EMPTY_SELECTION);
  const [menu, setMenu] = useState<{ column: ColumnT; x: number; y: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Notices describe the last action only, so they clear after a few seconds.
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const gridProps = useGlideGridProps({
    colors,
    maxPayloadBytes,
    onPasteRejected: setNotice,
    onHeaderRowSkipped: () => setNotice("The first pasted row matched the column names, so it was skipped.")
  });
  const { save, isSaving, error } = useGridSave({ onSave, maxPayloadBytes });

  const hasSelection =
    selection.current !== undefined || selection.rows.length > 0 || selection.columns.length > 0;

  const { isSearchOpen, openSearch, closeSearch } = useGridKeyboard({
    isEnabled: isKeyboardEnabled && menu === null,
    hasSelection,
    onClearSelection: () => setSelection(EMPTY_SELECTION),
    onEscapeWhenIdle: onRequestClose
  });

  const closeMenu = useCallback(() => setMenu(null), []);

  const scrollToColumn = (title: string) => {
    // Wait a frame so the grid has rendered the new column before scrolling to it.
    requestAnimationFrame(() => {
      // `state` is from before the add: the new column lands after the ID column and the
      // existing columns. scrollTo does not count the row-number column.
      gridRef.current?.scrollTo(state.columns.length + 1, 0, "horizontal");
      setNotice(`Added "${title}". It is saved with the next save.`);
    });
  };

  return (
    <div className="grid-editor">
      <div className="grid-editor__toolbar">
        <AddColumnForm onAdded={scrollToColumn} />
        <div className="grid-editor__actions">
          <button type="button" onClick={openSearch}>
            Search
          </button>
          <button type="button" disabled={!hasChanges || isSaving} onClick={() => void save()}>
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <DataEditor
        ref={gridRef}
        {...gridProps}
        width="100%"
        height={height}
        theme={theme}
        rowMarkers="number"
        freezeColumns={1}
        getCellsForSelection={true}
        gridSelection={selection}
        onGridSelectionChange={setSelection}
        showSearch={isSearchOpen}
        onSearchClose={closeSearch}
        onHeaderMenuClick={(col, bounds) => {
          const column = state.columns[col - 1];
          if (column) setMenu({ column, x: bounds.x, y: bounds.y + bounds.height });
        }}
        smoothScrollX
        smoothScrollY
      />

      <div className="grid-editor__footer" aria-live="polite">
        <span>
          {changeCount === 1 ? "1 changed cell" : `${changeCount.toLocaleString()} changed cells`}
        </span>
        {error && <span className="grid-editor__error">{error}</span>}
        {!error && notice && <span className="grid-editor__notice">{notice}</span>}
      </div>

      {menu && <ColumnMenu column={menu.column} position={menu} onClose={closeMenu} />}
    </div>
  );
};
