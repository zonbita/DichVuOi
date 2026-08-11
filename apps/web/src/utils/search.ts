/**
 * Tiện ích tìm kiếm không dấu cho toàn FE.
 * - `phraseMatch`: đúng cụm từ (ô search header tới /nhom).
 * - `fuzzyMatch`: gần đúng (dropdown tỉnh, gắn nghề…).
 */

/** Bỏ dấu tiếng Việt, hạ chữ thường: «Sửa chữa» thành «sua chua», «Đà Nẵng» thành «da nang». */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/** Chuẩn hoá khoảng trắng sau khi bỏ dấu. */
function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Khớp đúng cụm từ (không dấu).
 * Toàn bộ chuỗi tìm phải xuất hiện liền trong text — không typo / không gõ tắt.
 * Dấu câu trong tên dịch vụ bị bỏ khi so (vd. «dung - xu ly» ↔ «dung xu ly»).
 */
export function phraseMatch(haystack: string, query: string): boolean {
  const strip = (text: string) =>
    collapseSpaces(
      normalizeText(text).replace(/[^\p{L}\p{N}\s]+/gu, ' '),
    );
  const nq = strip(query);
  if (!nq) return true;
  return strip(haystack).includes(nq);
}

/** Khoảng cách Levenshtein (số phép sửa) — đo độ «gần đúng». */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Ngưỡng sai lệch cho phép theo độ dài từ khoá. */
function maxTypos(len: number): number {
  if (len <= 2) return 0;
  if (len <= 4) return 1;
  if (len <= 7) return 2;
  return 3;
}

/** Tất cả ký tự của `needle` xuất hiện đúng thứ tự trong `haystack` (gõ tắt). */
function isSubsequence(haystack: string, needle: string): boolean {
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j += 1) {
    if (haystack[j] === needle[i]) i += 1;
  }
  return i === needle.length;
}

/**
 * Khớp không dấu + gần đúng (dropdown tỉnh / gắn nghề).
 * - Rỗng: khớp mọi thứ.
 * - Trùng chuỗi con (đã bỏ dấu): khớp.
 * - Mỗi từ khoá khớp một từ trong text qua substring hoặc Levenshtein trong ngưỡng.
 * - Fallback: gõ tắt liền chuỗi (subsequence).
 */
export function fuzzyMatch(haystack: string, query: string): boolean {
  const nq = normalizeText(query);
  if (!nq) return true;

  const nh = normalizeText(haystack);
  if (nh.includes(nq)) return true;

  const hayWords = nh.split(/\s+/).filter(Boolean);
  const queryWords = nq.split(/\s+/).filter(Boolean);

  const everyWordMatches = queryWords.every((qw) =>
    hayWords.some(
      (hw) => hw.includes(qw) || levenshtein(hw, qw) <= maxTypos(qw.length),
    ),
  );
  if (everyWordMatches) return true;

  const compact = nq.replace(/\s+/g, '');
  return isSubsequence(nh.replace(/\s+/g, ''), compact);
}
