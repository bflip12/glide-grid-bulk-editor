const normalize = (text: string) => text.trim().toLowerCase();

/**
 * True when a pasted row is a copy of the column titles it would land on.
 *
 * A whole column copied from a spreadsheet usually starts with its header cell. This
 * compares each pasted cell with the title of the grid column it lands on, ignoring case and
 * surrounding spaces. Empty cells are ignored, and at least one cell must match.
 */
export const isHeaderRow = (
  row: readonly string[],
  gridTitles: string[],
  startColumn: number
): boolean => {
  let matched = 0;

  for (let offset = 0; offset < row.length; offset++) {
    const cell = normalize(row[offset] ?? "");
    if (cell === "") continue;

    const title = gridTitles[startColumn + offset];
    if (title === undefined || normalize(title) !== cell) return false;
    matched += 1;
  }

  return matched > 0;
};
