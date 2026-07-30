"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSkills = parseSkills;
exports.serializeSkills = serializeSkills;
exports.parseWorkModes = parseWorkModes;
exports.serializeWorkModes = serializeWorkModes;
exports.parseDistricts = parseDistricts;
exports.serializeDistricts = serializeDistricts;
exports.parseGallery = parseGallery;
exports.serializeGallery = serializeGallery;
function parseSkills(skillsJson) {
    if (!skillsJson?.trim())
        return [];
    try {
        const parsed = JSON.parse(skillsJson);
        if (Array.isArray(parsed)) {
            return parsed.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 12);
        }
    }
    catch {
    }
    return skillsJson
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12);
}
function serializeSkills(skills) {
    if (skills == null)
        return null;
    const list = Array.isArray(skills)
        ? skills
        : skills.split(',').map((s) => s.trim()).filter(Boolean);
    const clean = list.map((s) => s.trim()).filter(Boolean).slice(0, 12);
    return clean.length ? JSON.stringify(clean) : null;
}
function parseWorkModes(raw) {
    const parts = (raw ?? 'onsite')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s === 'onsite' || s === 'online');
    return parts.length ? [...new Set(parts)] : ['onsite'];
}
function serializeWorkModes(modes) {
    if (modes == null || modes === '')
        return 'onsite';
    const list = Array.isArray(modes)
        ? modes
        : modes.split(',').map((s) => s.trim().toLowerCase());
    const clean = [...new Set(list.filter((s) => s === 'onsite' || s === 'online'))];
    return (clean.length ? clean : ['onsite']).join(',');
}
function parseDistricts(raw) {
    if (!raw?.trim())
        return [];
    return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20);
}
function serializeDistricts(districts) {
    if (districts == null)
        return null;
    const list = Array.isArray(districts)
        ? districts
        : districts.split(',').map((s) => s.trim()).filter(Boolean);
    const clean = list.map((s) => s.trim()).filter(Boolean).slice(0, 20);
    return clean.length ? clean.join(', ') : null;
}
const MAX_GALLERY = 6;
function isHttpUrl(value) {
    try {
        const u = new URL(value);
        return u.protocol === 'http:' || u.protocol === 'https:';
    }
    catch {
        return false;
    }
}
function parseGallery(galleryJson) {
    if (!galleryJson?.trim())
        return [];
    try {
        const parsed = JSON.parse(galleryJson);
        if (!Array.isArray(parsed))
            return [];
        return parsed
            .map(String)
            .map((s) => s.trim())
            .filter((s) => s && isHttpUrl(s))
            .slice(0, MAX_GALLERY);
    }
    catch {
        return [];
    }
}
function serializeGallery(urls) {
    if (urls == null)
        return null;
    const list = Array.isArray(urls)
        ? urls
        : urls
            .split(/\n|,/)
            .map((s) => s.trim())
            .filter(Boolean);
    const clean = [...new Set(list.map((s) => s.trim()).filter((s) => s && isHttpUrl(s)))].slice(0, MAX_GALLERY);
    return clean.length ? JSON.stringify(clean) : null;
}
//# sourceMappingURL=partner-profile-fields.js.map