import type { SaveRequestT } from "../hooks/grid-editor/gridEditor.types";

/** Stands in for the server: waits briefly, then accepts the request. */
export const fakeSave = (request: SaveRequestT): Promise<void> =>
  new Promise((resolve) => {
    // Log what a real server would receive.
    console.info("Save request", request);
    window.setTimeout(resolve, 600);
  });
