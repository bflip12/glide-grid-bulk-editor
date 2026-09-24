import type { GridDataT } from "../hooks/grid-editor/gridEditor.types";

/**
 * Four sites and two columns.
 *
 *   Site     Depth   Status
 *   Site A   10      Active
 *   Site B           Planned
 *   Site C   30
 *   Site D
 */
export const createFixture = (): GridDataT => ({
  idColumnTitle: "Site",
  rowIds: ["Site A", "Site B", "Site C", "Site D"],
  columns: [
    { id: "depth", title: "Depth", values: { "Site A": "10", "Site C": "30" } },
    { id: "status", title: "Status", values: { "Site A": "Active", "Site B": "Planned" } }
  ]
});
