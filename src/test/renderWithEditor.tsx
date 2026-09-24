import type { ReactNode } from "react";

import { GridEditorProvider } from "../hooks/grid-editor/GridEditorContext";
import { createFixture } from "./fixtures";

/** A wrapper for renderHook and render that provides the editor state with the fixture data. */
export const EditorWrapper = ({ children }: { children: ReactNode }) => (
  <GridEditorProvider initialData={createFixture()}>{children}</GridEditorProvider>
);
