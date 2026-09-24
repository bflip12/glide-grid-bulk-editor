import { useEffect, useRef, useState } from "react";

import { GridEditor } from "../components/grid-editor/GridEditor";
import { useGridEditor } from "../hooks/grid-editor/GridEditorContext";
import { fakeSave } from "./fakeSave";

type EditorModalPropsT = {
  onClose: () => void;
};

/**
 * The editor in a modal. Like most modal components, it closes on Escape from its own
 * keydown handler; the grid's capture-phase handler decides first whether Escape is for
 * the grid. Closing with unsaved changes asks first.
 */
export const EditorModal = ({ onClose }: EditorModalPropsT) => {
  const { state, dispatch, hasChanges, changeCount } = useGridEditor();
  const [isConfirming, setIsConfirming] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => dialogRef.current?.focus(), []);

  const requestClose = () => {
    if (hasChanges) setIsConfirming(true);
    else onClose();
  };

  const discard = () => {
    const { idColumnTitle, rowIds, savedColumns } = state;
    dispatch({ type: "load", data: { idColumnTitle, rowIds, columns: savedColumns } });
    setIsConfirming(false);
    onClose();
  };

  return (
    <div className="modal__backdrop">
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            if (isConfirming) setIsConfirming(false);
            else requestClose();
          }
        }}
      >
        <header className="modal__header">
          <h2 id="modal-title">Edit sites</h2>
          <button type="button" aria-label="Close" onClick={requestClose}>
            ×
          </button>
        </header>

        <GridEditor
          height={460}
          onSave={fakeSave}
          onRequestClose={requestClose}
          isKeyboardEnabled={!isConfirming}
        />

        {isConfirming && (
          <div className="modal__confirm" role="alertdialog" aria-labelledby="confirm-text">
            <p id="confirm-text">
              Discard {changeCount === 1 ? "1 changed cell" : `${changeCount} changed cells`} and any
              new columns?
            </p>
            <button type="button" onClick={() => setIsConfirming(false)} autoFocus>
              Keep editing
            </button>
            <button type="button" className="grid-editor__danger" onClick={discard}>
              Discard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
