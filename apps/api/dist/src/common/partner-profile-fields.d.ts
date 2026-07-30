export declare function parseSkills(skillsJson: string | null | undefined): string[];
export declare function serializeSkills(skills: string[] | string | null | undefined): string | null;
export declare function parseWorkModes(raw: string | null | undefined): Array<'onsite' | 'online'>;
export declare function serializeWorkModes(modes: Array<'onsite' | 'online'> | string | null | undefined): string;
export declare function parseDistricts(raw: string | null | undefined): string[];
export declare function serializeDistricts(districts: string[] | string | null | undefined): string | null;
export declare function parseGallery(galleryJson: string | null | undefined): string[];
export declare function serializeGallery(urls: string[] | string | null | undefined): string | null;
