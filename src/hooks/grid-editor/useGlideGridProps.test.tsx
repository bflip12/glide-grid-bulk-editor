import { act, renderHook } from "@testing-library/react";
import { GridCellKind } from "@glideapps/glide-data-grid";
import type { EditableGridCell, Item } from "@glideapps/glide-data-grid";
import { describe, expect, it, vi } from "vitest";

import { EditorWrapper } from "../../test/renderWithEditor";
import { useGridEditor } from "./GridEditorContext";
import { useGlideGridProps } from "./useGlideGridProps";

const textEdit = (location: Item, data: string) => ({
  location,
  value: { kind: GridCellKind.Text, data, displayData: data, allowOverlay: true } as EditableGridCell
});

const setup = (params: Parameters<typeof useGlideGridProps>[0] = {}) =>
  renderHook(() => ({ grid: useGlideGridProps(params), editor: useGridEditor() }), {
    wrapper: EditorWrapper
  });

const cellText = (grid: ReturnType<typeof useGlideGridProps>, item: Item) => {
  const cell = grid.getCellContent(item);
  return cell.kind === GridCellKind.Text ? cell.data : undefined;
};

describe("useGlideGridProps", () => {
  it("puts a read-only ID column first", () => {
    const { result } = setup();

    expect(result.current.grid.columns.map((c) => c.title)).toEqual(["Site", "Depth", "Status"]);
    expect(result.current.grid.getCellContent([0, 1])).toMatchObject({ data: "Site B", readonly: true });
  });

  it("reads cells through the visible row order", () => {
    const { result } = setup();
    act(() => result.current.editor.dispatch({ type: "setFilter", columnId: "depth", filter: "noValue" }));

    expect(result.current.grid.rows).toBe(2);
    expect(cellText(result.current.grid, [0, 0])).toBe("Site B");
    expect(cellText(result.current.grid, [0, 1])).toBe("Site D");
  });

  it("records an edit against the row ID of the visible row", () => {
    const { result } = setup();
    act(() => result.current.editor.dispatch({ type: "setFilter", columnId: "depth", filter: "noValue" }));

    let handled: boolean | void = false;
    act(() => {
      handled = result.current.grid.onCellsEdited([textEdit([1, 1], "40")]);
    });

    expect(handled).toBe(true);
    expect(result.current.editor.saveRequest.updates).toEqual([
      { columnId: "depth", rowId: "Site D", value: "40" }
    ]);
  });

  it("ignores edits to the ID column", () => {
    const { result } = setup();
    act(() => {
      result.current.grid.onCellsEdited([textEdit([0, 0], "Renamed")]);
    });

    expect(result.current.editor.changeCount).toBe(0);
  });

  it("applies a paste itself and tells Glide not to", () => {
    const onHeaderRowSkipped = vi.fn();
    const { result } = setup({ onHeaderRowSkipped });

    let returned = true;
    act(() => {
      returned = result.current.grid.onPaste([1, 0], [["Depth"], ["11"], ["12"]]);
    });

    expect(returned).toBe(false);
    expect(onHeaderRowSkipped).toHaveBeenCalledOnce();
    expect(cellText(result.current.grid, [1, 0])).toBe("11");
    expect(result.current.editor.saveRequest.updates).toEqual([
      { columnId: "depth", rowId: "Site A", value: "11" },
      { columnId: "depth", rowId: "Site B", value: "12" }
    ]);
  });

  it("rejects a paste over the size limit", () => {
    const onPasteRejected = vi.fn();
    const { result } = setup({ maxPayloadBytes: 10, onPasteRejected });

    act(() => {
      result.current.grid.onPaste([1, 0], [["11"], ["12"]]);
    });

    expect(onPasteRejected).toHaveBeenCalledWith(expect.stringContaining("over the"));
    expect(result.current.editor.changeCount).toBe(0);
  });

  it("marks changed cells and new columns", () => {
    const { result } = setup({ colors: { changedCellBg: "yellow", newColumnHeaderBg: "blue" } });
    act(() => {
      result.current.grid.onCellsEdited([textEdit([1, 1], "20")]);
      result.current.editor.dispatch({ type: "addColumn", title: "Owner" });
    });

    expect(result.current.grid.getCellContent([1, 1]).themeOverride).toEqual({ bgCell: "yellow" });
    expect(result.current.grid.getCellContent([1, 0]).themeOverride).toBeUndefined();
    expect(result.current.grid.columns[3].themeOverride).toMatchObject({ bgHeader: "blue" });
  });
});
