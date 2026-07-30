import { RequirementSource } from '@prisma/client';
export type RequirementSeedItem = {
    content: string;
    source: RequirementSource;
    sortOrder: number;
};
export declare function parseRequirementLines(text: string | null | undefined, source: RequirementSource, startOrder?: number): RequirementSeedItem[];
export declare function buildRequirementSeeds(input: {
    includes?: string | null;
    customerNote?: string | null;
}): RequirementSeedItem[];
