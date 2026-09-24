import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ColumnT } from "../../hooks/grid-editor/gridEditor.types";
import { useGridEditor } from "../../hooks/grid-editor/GridEditorContext";
import { EditorWrapper } from "../../test/renderWithEditor";
import { ColumnMenu } from "./ColumnMenu";

const State = () => {
  const { state } = useGridEditor();
  return <output>{JSON.stringify({ filters: state.filters, columns: state.columns.map((c) => c.id) })}</output>;
};

const renderMenu = (column: ColumnT, onClose = vi.fn()) => {
  render(
    <EditorWrapper>
      <ColumnMenu column={column} position={{ x: 0, y: 0 }} onClose={onClose} />
      <State />
    </EditorWrapper>
  );
  return onClose;
};

describe("ColumnMenu", () => {
  it("sets a filter and closes", async () => {
    const onClose = renderMenu({ id: "depth", title: "Depth", values: {} });

    await userEvent.click(screen.getByRole("menuitemradio", { name: "Show rows without a value" }));

    expect(screen.getByRole("status").textContent).toContain('"filters":{"depth":"noValue"}');
    expect(onClose).toHaveBeenCalled();
  });

  it("offers removal only for unsaved columns", () => {
    renderMenu({ id: "depth", title: "Depth", values: {} });

    expect(screen.queryByRole("menuitem", { name: "Remove column" })).toBeNull();
  });

  it("closes on Escape", async () => {
    const onClose = renderMenu({ id: "depth", title: "Depth", values: {} });

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });
});
