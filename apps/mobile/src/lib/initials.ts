/**
 * 1–2 uppercase letters: the first letters of the first two words, or the
 * single first letter of a one-word name.
 */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "?";
  }
  const first = (words[0] as string).charAt(0);
  if (words.length === 1) {
    return first.toUpperCase();
  }
  return (first + (words[1] as string).charAt(0)).toUpperCase();
}
