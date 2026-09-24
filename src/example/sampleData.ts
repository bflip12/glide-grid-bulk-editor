import type { ColumnT, GridDataT } from "../hooks/grid-editor/gridEditor.types";

const COLUMN_TITLES = [
  "Region", "Zone", "Status", "Owner", "Capacity", "Area", "Elevation", "Survey year",
  "Inspector", "Access", "Surface", "Condition", "Priority", "Crew", "Permit",
  "Reading A", "Reading B", "Reading C", "Flow", "Pressure", "Temperature", "Grade",
  "Contact", "Phone", "Notes"
];

const REGIONS = ["North", "South", "East", "West"];
const STATUSES = ["Active", "Planned", "Paused", "Closed"];

// Deterministic pseudo-random numbers, so the sample data is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

const cellValue = (title: string, row: number, random: () => number): string => {
  if (random() < 0.3) return ""; // leave gaps, so the "has a value" filters do something
  switch (title) {
    case "Region":
      return REGIONS[row % REGIONS.length];
    case "Status":
      return STATUSES[Math.floor(random() * STATUSES.length)];
    case "Zone":
      return `Z${1 + (row % 12)}`;
    default:
      return String(Math.round(random() * 1000));
  }
};

/** `rowCount` sites by 25 columns. The default, 1,000 rows, is 25,000 cells. */
export const createSampleData = (rowCount = 1000): GridDataT => {
  const random = seeded(42);
  const rowIds = Array.from({ length: rowCount }, (_, i) => `Site ${String(i + 1).padStart(4, "0")}`);

  const columns: ColumnT[] = COLUMN_TITLES.map((title) => ({
    id: title.toLowerCase().replace(/\s+/g, "-"),
    title,
    values: {}
  }));

  rowIds.forEach((rowId, row) => {
    for (const column of columns) {
      const value = cellValue(column.title, row, random);
      if (value !== "") column.values[rowId] = value;
    }
  });

  return { idColumnTitle: "Site", rowIds, columns };
};
