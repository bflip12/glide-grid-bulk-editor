import { describe, expect, it } from "vitest";

import { createFixture } from "../../test/fixtures";
import type { GridEditorActionT, GridEditorStateT } from "./gridEditor.types";
import { createGridEditorState, gridEditorReducer } from "./gridEditorReducer";
import { buildSaveRequest } from "./utils/buildSaveRequest";

const run = (...actions: GridEditorActionT[]): GridEditorStateT =>
  actions.reduce(gridEditorReducer, createGridEditorState(createFixture()));

const pending = (state: GridEditorStateT) => buildSaveRequest(state.columns, state.changes);

describe("gridEditorReducer", () => {
  it("applies changes to the column values and records them", () => {
    const state = run({ type: "applyChanges", changes: [{ columnId: "depth", rowId: "Site B", value: "20" }] });

    expect(state.columns[0].values["Site B"]).toBe("20");
    expect(pending(state).updates).toEqual([{ columnId: "depth", rowId: "Site B", value: "20" }]);
  });

  it("leaves untouched columns as the same objects", () => {
    const before = createGridEditorState(createFixture());
    const after = gridEditorReducer(before, {
      type: "applyChanges",
      changes: [{ columnId: "depth", rowId: "Site B", value: "20" }]
    });

    expect(after.columns[1]).toBe(before.columns[1]);
  });

  it("returns the same state for an empty change list", () => {
    const before = createGridEditorState(createFixture());

    expect(gridEditorReducer(before, { type: "applyChanges", changes: [] })).toBe(before);
  });

  it("adds a new, unsaved column", () => {
    const state = run({ type: "addColumn", title: " Owner " });

    expect(state.columns[state.columns.length - 1]).toEqual({ id: "new:Owner", title: "Owner", values: {}, isNew: true });
    expect(pending(state).newColumns).toEqual([{ id: "new:Owner", title: "Owner" }]);
  });

  it("removes an unsaved column together with its pending edits and filter", () => {
    const state = run(
      { type: "addColumn", title: "Owner" },
      { type: "applyChanges", changes: [{ columnId: "new:Owner", rowId: "Site A", value: "Kim" }] },
      { type: "setFilter", columnId: "new:Owner", filter: "hasValue" },
      { type: "removeColumn", columnId: "new:Owner" }
    );

    expect(state.columns.map((c) => c.id)).toEqual(["depth", "status"]);
    expect(pending(state)).toEqual({ newColumns: [], updates: [] });
    expect(state.filters).toEqual({});
  });

  it("does not remove a saved column", () => {
    const before = createGridEditorState(createFixture());

    expect(gridEditorReducer(before, { type: "removeColumn", columnId: "depth" })).toBe(before);
  });

  it("sets a column filter", () => {
    const state = run({ type: "setFilter", columnId: "depth", filter: "noValue" });

    expect(state.filters).toEqual({ depth: "noValue" });
  });

  it("marks what was sent as saved", () => {
    const edited = run(
      { type: "addColumn", title: "Owner" },
      { type: "applyChanges", changes: [
        { columnId: "depth", rowId: "Site B", value: "20" },
        { columnId: "new:Owner", rowId: "Site A", value: "Kim" }
      ] }
    );
    const state = gridEditorReducer(edited, { type: "saved", request: pending(edited) });

    expect(pending(state)).toEqual({ newColumns: [], updates: [] });
    expect(state.columns.every((c) => !c.isNew)).toBe(true);
    // Setting a cell back to its old value is now a change, because the saved value moved.
    const after = gridEditorReducer(state, {
      type: "applyChanges",
      changes: [{ columnId: "depth", rowId: "Site B", value: "" }]
    });
    expect(pending(after).updates).toEqual([{ columnId: "depth", rowId: "Site B", value: "" }]);
  });

  it("keeps edits made while a save was in flight", () => {
    const edited = run({ type: "applyChanges", changes: [{ columnId: "depth", rowId: "Site B", value: "20" }] });
    const sent = pending(edited);
    const editedAgain = gridEditorReducer(edited, {
      type: "applyChanges",
      changes: [
        { columnId: "depth", rowId: "Site B", value: "21" },
        { columnId: "status", rowId: "Site D", value: "Active" }
      ]
    });

    const state = gridEditorReducer(editedAgain, { type: "saved", request: sent });

    expect(pending(state).updates).toEqual([
      { columnId: "depth", rowId: "Site B", value: "21" },
      { columnId: "status", rowId: "Site D", value: "Active" }
    ]);
  });

  it("reloads from data, clearing changes and filters", () => {
    const state = run(
      { type: "applyChanges", changes: [{ columnId: "depth", rowId: "Site B", value: "20" }] },
      { type: "setFilter", columnId: "depth", filter: "hasValue" },
      { type: "load", data: createFixture() }
    );

    expect(state.changes.size).toBe(0);
    expect(state.filters).toEqual({});
    expect(state.columns[0].values["Site B"]).toBeUndefined();
  });
});
