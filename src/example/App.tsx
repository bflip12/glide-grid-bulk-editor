import { useMemo, useState } from "react";

import { GridEditorProvider, useGridEditor } from "../hooks/grid-editor/GridEditorContext";
import { EditorModal } from "./EditorModal";
import { createSampleData } from "./sampleData";

const PendingRequest = () => {
  const { saveRequest, changeCount } = useGridEditor();
  const preview = {
    newColumns: saveRequest.newColumns,
    updates: saveRequest.updates.slice(0, 20)
  };

  return (
    <section className="example__panel">
      <h2>Next save request</h2>
      <p className="example__muted">
        {changeCount} changed cells, {saveRequest.newColumns.length} new columns
        {saveRequest.updates.length > 20 ? ". Showing the first 20 updates." : "."}
      </p>
      <pre>{JSON.stringify(preview, null, 2)}</pre>
    </section>
  );
};

export const App = () => {
  const initialData = useMemo(() => createSampleData(), []);
  const [isOpen, setIsOpen] = useState(true);

  return (
    <GridEditorProvider initialData={initialData}>
      <main className="example">
        <h1>Glide Data Grid bulk editor</h1>
        <p className="example__lead">
          1,000 sites by 25 columns (25,000 cells). Edit or paste, filter a column from its header
          arrow, add a column, then save once. Ctrl+F searches the grid. Escape closes one thing
          at a time.
        </p>
        <button type="button" onClick={() => setIsOpen(true)}>
          Open the editor
        </button>
        <PendingRequest />
        {isOpen && <EditorModal onClose={() => setIsOpen(false)} />}
      </main>
    </GridEditorProvider>
  );
};
