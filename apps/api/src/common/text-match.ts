/** Bỏ dấu tiếng Việt — khớp cụm từ tìm kiếm (đồng bộ FE `phraseMatch`). */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Khớp đúng cụm từ (không dấu; bỏ dấu câu). */
export function phraseMatch(haystack: string, query: string): boolean {
  const strip = (value: string) =>
    collapseSpaces(normalizeText(value).replace(/[^\p{L}\p{N}\s]+/gu, ' '));
  const nq = strip(query);
  if (!nq) return true;
  return strip(haystack).includes(nq);
}
