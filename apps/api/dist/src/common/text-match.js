"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeText = normalizeText;
exports.phraseMatch = phraseMatch;
function normalizeText(text) {
    return text
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();
}
function collapseSpaces(text) {
    return text.replace(/\s+/g, ' ').trim();
}
function phraseMatch(haystack, query) {
    const strip = (value) => collapseSpaces(normalizeText(value).replace(/[^\p{L}\p{N}\s]+/gu, ' '));
    const nq = strip(query);
    if (!nq)
        return true;
    return strip(haystack).includes(nq);
}
//# sourceMappingURL=text-match.js.map