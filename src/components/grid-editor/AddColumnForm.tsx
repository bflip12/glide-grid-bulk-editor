import { useState } from "react";
import type { FormEvent } from "react";

import { useGridEditor } from "../../hooks/grid-editor/GridEditorContext";
import { validateColumnTitle } from "../../hooks/grid-editor/utils/validateColumnTitle";

type AddColumnFormPropsT = {
  /** Called with the new column's title after it is added, for example to scroll to it. */
  onAdded?: (title: string) => void;
};

/** A text input and button that add an unsaved column, with the validation shown inline. */
export const AddColumnForm = ({ onAdded }: AddColumnFormPropsT) => {
  const { state, dispatch } = useGridEditor();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateColumnTitle(title, state.columns);
    if (!result.isValid) {
      setError(result.error);
      return;
    }
    dispatch({ type: "addColumn", title });
    onAdded?.(title.trim());
    setTitle("");
    setError(null);
  };

  return (
    <form className="grid-editor__add-column" onSubmit={handleSubmit}>
      <label className="grid-editor__label" htmlFor="new-column-title">
        New column
      </label>
      <input
        id="new-column-title"
        value={title}
        placeholder="Column name"
        aria-invalid={error !== null}
        aria-describedby={error ? "new-column-error" : undefined}
        onChange={(event) => {
          setTitle(event.target.value);
          setError(null);
        }}
      />
      <button type="submit">Add column</button>
      {error && (
        <span id="new-column-error" className="grid-editor__error" role="alert">
          {error}
        </span>
      )}
    </form>
  );
};
