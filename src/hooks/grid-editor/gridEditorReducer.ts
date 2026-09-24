import type {
  CellChangeT,
  GridDataT,
  GridEditorActionT,
  GridEditorStateT
} from "./gridEditor.types";
import { addChangesToMap } from "./utils/addChangesToMap";

export const NEW_COLUMN_ID_PREFIX = "new:";

export const createGridEditorState = (data: GridDataT): GridEditorStateT => ({
  ...data,
  savedColumns: data.columns,
  changes: new Map(),
  filters: {}
});

/**
 * All editor state changes go through here. Every case is a pure function of the state and
 * the action, so each one is tested without rendering the grid.
 */
export const gridEditorReducer = (
  state: GridEditorStateT,
  action: GridEditorActionT
): GridEditorStateT => {
  switch (action.type) {
    case "load":
      return createGridEditorState(action.data);

    case "applyChanges": {
      if (action.changes.length === 0) return state;

      // Group values by column, so each touched column's values are copied once.
      const byColumn = new Map<string, Record<string, string>>();
      for (const { columnId, rowId, value } of action.changes) {
        if (!byColumn.has(columnId)) byColumn.set(columnId, {});
        byColumn.get(columnId)![rowId] = value;
      }

      const columns = state.columns.map((column) => {
        const updates = byColumn.get(column.id);
        return updates ? { ...column, values: { ...column.values, ...updates } } : column;
      });

      return {
        ...state,
        columns,
        changes: addChangesToMap(state.changes, action.changes, state.savedColumns)
      };
    }

    case "addColumn": {
      const title = action.title.trim();
      const column = { id: `${NEW_COLUMN_ID_PREFIX}${title}`, title, values: {}, isNew: true };
      return { ...state, columns: [...state.columns, column] };
    }

    case "removeColumn": {
      // Only unsaved columns can be removed. Their pending edits go with them, or the next
      // save would send cells for a column that no longer exists.
      const column = state.columns.find((c) => c.id === action.columnId);
      if (!column?.isNew) return state;

      const changes = new Map(state.changes);
      changes.delete(action.columnId);
      const { [action.columnId]: _removed, ...filters } = state.filters;

      return {
        ...state,
        columns: state.columns.filter((c) => c.id !== action.columnId),
        changes,
        filters
      };
    }

    case "setFilter":
      return { ...state, filters: { ...state.filters, [action.columnId]: action.filter } };

    case "saved": {
      // Mark only what was sent as saved. Edits made while the request was in flight stay
      // pending, because the server has not seen them.
      const sentNewColumnIds = new Set(action.request.newColumns.map((column) => column.id));

      const savedValues = new Map(state.savedColumns.map((c) => [c.id, { ...c.values }]));
      sentNewColumnIds.forEach((id) => savedValues.set(id, {}));
      for (const { columnId, rowId, value } of action.request.updates) {
        const values = savedValues.get(columnId);
        if (values) values[rowId] = value;
      }

      const columns = state.columns.map((column) =>
        sentNewColumnIds.has(column.id) ? { ...column, isNew: false } : column
      );
      const savedColumns = columns
        .filter((column) => savedValues.has(column.id))
        .map((column) => ({ ...column, values: savedValues.get(column.id)! }));

      // Re-check every pending change against the new saved values.
      const pending: CellChangeT[] = [];
      state.changes.forEach((rows, columnId) => {
        rows.forEach((value, rowId) => pending.push({ columnId, rowId, value }));
      });

      return {
        ...state,
        columns,
        savedColumns,
        changes: addChangesToMap(new Map(), pending, savedColumns)
      };
    }
  }
};
