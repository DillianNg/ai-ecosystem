/**
 * Remove duplicate companies by id (first row wins).
 * @param {Record<string, string>[]} rows
 */
export function dedupeById(rows) {
  const seen = new Set();
  const unique = [];
  const duplicates = [];

  for (const row of rows) {
    const id = (row.id ?? "").trim().toLowerCase();
    if (!id) {
      unique.push(row);
      continue;
    }
    if (seen.has(id)) {
      duplicates.push(id);
      continue;
    }
    seen.add(id);
    unique.push(row);
  }

  return { rows: unique, duplicates };
}
