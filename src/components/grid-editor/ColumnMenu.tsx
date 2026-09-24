import { useEffect, useRef } from "react";

import type { ColumnFilterT, ColumnT } from "../../hooks/grid-editor/gridEditor.types";
import { useGridEditor } from "../../hooks/grid-editor/GridEditorContext";

const FILTER_OPTIONS: { value: ColumnFilterT; label: string }[] = [
  { value: "all", label: "Show all rows" },
  { value: "hasValue", label: "Show rows with a value" },
  { value: "noValue", label: "Show rows without a value" }
];

type ColumnMenuPropsT = {
  column: ColumnT;
  position: { x: number; y: number };
  onClose: () => void;
};

/**
 * The menu behind a column header's arrow: row filters for every column, and "Remove column"
 * for a column that has not been saved yet. Escape or a click outside closes it.
 */
export const ColumnMenu = ({ column, position, onClose }: ColumnMenuPropsT) => {
  const { state, dispatch } = useGridEditor();
  const menuRef = useRef<HTMLDivElement>(null);
  const current = state.filters[column.id] ?? "all";

  useEffect(() => {
    menuRef.current?.querySelector("button")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="grid-editor__menu"
      role="menu"
      aria-label={`${column.title} column`}
      style={{ left: position.x, top: position.y }}
    >
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="menuitemradio"
          aria-checked={current === option.value}
          onClick={() => {
            dispatch({ type: "setFilter", columnId: column.id, filter: option.value });
            onClose();
          }}
        >
          {option.label}
        </button>
      ))}
      {column.isNew && (
        <button
          type="button"
          role="menuitem"
          className="grid-editor__danger"
          onClick={() => {
            dispatch({ type: "removeColumn", columnId: column.id });
            onClose();
          }}
        >
          Remove column
        </button>
      )}
    </div>
  );
};
