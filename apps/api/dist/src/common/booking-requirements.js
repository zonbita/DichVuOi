"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRequirementLines = parseRequirementLines;
exports.buildRequirementSeeds = buildRequirementSeeds;
const client_1 = require("@prisma/client");
function parseRequirementLines(text, source, startOrder = 0) {
    if (!text?.trim())
        return [];
    const lines = text
        .split(/\r?\n|;|•|·|(?<=\d)[.)]\s+|(?:,\s+(?=[A-ZÀ-Ỹ]))/)
        .map((line) => line
        .replace(/^[-*•·\d.)\s]+/, '')
        .replace(/\s+/g, ' ')
        .trim())
        .filter((line) => line.length >= 2);
    const unique = [];
    for (const line of lines) {
        if (!unique.some((u) => u.toLowerCase() === line.toLowerCase())) {
            unique.push(line);
        }
    }
    const items = unique.length > 0 ? unique : [text.trim()];
    return items.map((content, i) => ({
        content: content.slice(0, 500),
        source,
        sortOrder: startOrder + i,
    }));
}
function buildRequirementSeeds(input) {
    const fromIncludes = parseRequirementLines(input.includes, client_1.RequirementSource.SERVICE_INCLUDES, 0);
    const fromNote = parseRequirementLines(input.customerNote, client_1.RequirementSource.CUSTOMER_NOTE, fromIncludes.length);
    return [...fromIncludes, ...fromNote];
}
//# sourceMappingURL=booking-requirements.js.map