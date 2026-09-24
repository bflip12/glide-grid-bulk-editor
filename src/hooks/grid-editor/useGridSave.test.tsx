import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EditorWrapper } from "../../test/renderWithEditor";
import type { SaveRequestT } from "./gridEditor.types";
import { useGridEditor } from "./GridEditorContext";
import { useGridSave } from "./useGridSave";

const setup = (onSave: (request: SaveRequestT) => Promise<void>, maxPayloadBytes?: number) => {
  const hook = renderHook(() => ({ save: useGridSave({ onSave, maxPayloadBytes }), editor: useGridEditor() }), {
    wrapper: EditorWrapper
  });
  act(() =>
    hook.result.current.editor.dispatch({
      type: "applyChanges",
      changes: [{ columnId: "depth", rowId: "Site B", value: "20" }]
    })
  );
  return hook;
};

describe("useGridSave", () => {
  it("sends one request and clears the changes after it succeeds", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = setup(onSave);

    await act(async () => {
      expect(await result.current.save.save()).toBe(true);
    });

    expect(onSave).toHaveBeenCalledWith({
      newColumns: [],
      updates: [{ columnId: "depth", rowId: "Site B", value: "20" }]
    });
    expect(result.current.editor.changeCount).toBe(0);
  });

  it("keeps the changes and shows the error when the save fails", async () => {
    const { result } = setup(vi.fn().mockRejectedValue(new Error("Server unavailable")));

    await act(async () => {
      expect(await result.current.save.save()).toBe(false);
    });

    expect(result.current.save.error).toBe("Server unavailable");
    expect(result.current.editor.changeCount).toBe(1);
  });

  it("does not send a request over the size limit", async () => {
    const onSave = vi.fn();
    const { result } = setup(onSave, 10);

    await act(async () => {
      await result.current.save.save();
    });

    expect(onSave).not.toHaveBeenCalled();
    expect(result.current.save.error).toContain("over the");
  });
});
