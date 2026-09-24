import { createContext, useContext, useMemo, useReducer } from "react";
import type { ReactNode } from "react";

import type { GridDataT, GridEditorContextValueT } from "./gridEditor.types";
import { createGridEditorState, gridEditorReducer } from "./gridEditorReducer";
import { buildSaveRequest } from "./utils/buildSaveRequest";
import { countChanges } from "./utils/countChanges";
import { getVisibleRowIds } from "./utils/getVisibleRowIds";

const GridEditorContext = createContext<GridEditorContextValueT | null>(null);

type GridEditorProviderPropsT = {
  initialData: GridDataT;
  children: ReactNode;
};

/**
 * Holds the editor state in a reducer and shares it with the grid, the toolbar and the save
 * button. Values that can be worked out from the state (visible rows, change count, the save
 * request) are derived here and never stored, so they cannot go out of date.
 */
export const GridEditorProvider = ({ initialData, children }: GridEditorProviderPropsT) => {
  const [state, dispatch] = useReducer(gridEditorReducer, initialData, createGridEditorState);

  const visibleRowIds = useMemo(
    () => getVisibleRowIds(state.rowIds, state.columns, state.filters),
    [state.rowIds, state.columns, state.filters]
  );

  const value = useMemo<GridEditorContextValueT>(() => {
    const changeCount = countChanges(state.changes);
    return {
      state,
      dispatch,
      visibleRowIds,
      changeCount,
      hasChanges: changeCount > 0 || state.columns.some((column) => column.isNew),
      saveRequest: buildSaveRequest(state.columns, state.changes)
    };
  }, [state, visibleRowIds]);

  return <GridEditorContext.Provider value={value}>{children}</GridEditorContext.Provider>;
};

export const useGridEditor = (): GridEditorContextValueT => {
  const value = useContext(GridEditorContext);
  if (!value) throw new Error("useGridEditor must be used inside a GridEditorProvider");
  return value;
};
