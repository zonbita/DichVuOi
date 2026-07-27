import { RequirementSource } from '@prisma/client';

export type RequirementSeedItem = {
  content: string;
  source: RequirementSource;
  sortOrder: number;
};

/** Tách includes / ghi chú thành các mục checklist. */
export function parseRequirementLines(
  text: string | null | undefined,
  source: RequirementSource,
  startOrder = 0,
): RequirementSeedItem[] {
  if (!text?.trim()) return [];

  const lines = text
    .split(/\r?\n|;|•|·|(?<=\d)[.)]\s+|(?:,\s+(?=[A-ZÀ-Ỹ]))/)
    .map((line) =>
      line
        .replace(/^[-*•·\d.)\s]+/, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((line) => line.length >= 2);

  const unique: string[] = [];
  for (const line of lines) {
    if (!unique.some((u) => u.toLowerCase() === line.toLowerCase())) {
      unique.push(line);
    }
  }

  // Nếu tách không ra dòng nào hữu ích — giữ nguyên đoạn.
  const items = unique.length > 0 ? unique : [text.trim()];
  return items.map((content, i) => ({
    content: content.slice(0, 500),
    source,
    sortOrder: startOrder + i,
  }));
}

export function buildRequirementSeeds(input: {
  includes?: string | null;
  customerNote?: string | null;
}): RequirementSeedItem[] {
  const fromIncludes = parseRequirementLines(
    input.includes,
    RequirementSource.SERVICE_INCLUDES,
    0,
  );
  const fromNote = parseRequirementLines(
    input.customerNote,
    RequirementSource.CUSTOMER_NOTE,
    fromIncludes.length,
  );
  return [...fromIncludes, ...fromNote];
}
