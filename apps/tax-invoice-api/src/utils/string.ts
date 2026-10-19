/**
 * Escapes regex metacharacters so user input is treated as literal text
 * when interpolated into a MongoDB `$regex`.
 *
 * Without this, characters like `.`, `*`, `(`, `[` change query semantics
 * (e.g. `search=INV.001` would also match `INV-001`), and crafted input
 * could act as a regex injection vector.
 *
 * @param value - raw user-supplied search text
 * @returns the value with all regex metacharacters backslash-escaped
 */
export const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
