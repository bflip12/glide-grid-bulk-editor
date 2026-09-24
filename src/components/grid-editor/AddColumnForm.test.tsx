import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { useGridEditor } from "../../hooks/grid-editor/GridEditorContext";
import { EditorWrapper } from "../../test/renderWithEditor";
import { AddColumnForm } from "./AddColumnForm";

const ColumnTitles = () => <output>{useGridEditor().state.columns.map((c) => c.title).join(", ")}</output>;

const renderForm = (onAdded = vi.fn()) =>
  render(
    <EditorWrapper>
      <AddColumnForm onAdded={onAdded} />
      <ColumnTitles />
    </EditorWrapper>
  );

describe("AddColumnForm", () => {
  it("adds a column and clears the input", async () => {
    const onAdded = vi.fn();
    renderForm(onAdded);

    await userEvent.type(screen.getByLabelText("New column"), "Owner{Enter}");

    expect(screen.getByRole("status").textContent).toContain("Depth, Status, Owner");
    expect(onAdded).toHaveBeenCalledWith("Owner");
    expect((screen.getByLabelText("New column") as HTMLInputElement).value).toBe("");
  });

  it("shows an error for an empty name", async () => {
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Add column" }));

    expect(screen.getByRole("alert").textContent).toContain("Column name is required");
  });

  it("shows an error for a duplicate name and clears it when the user types", async () => {
    renderForm();
    const input = screen.getByLabelText("New column");

    await userEvent.type(input, "Depth{Enter}");
    expect(screen.getByRole("alert").textContent).toContain('Column "Depth" already exists');

    await userEvent.type(input, "2");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
