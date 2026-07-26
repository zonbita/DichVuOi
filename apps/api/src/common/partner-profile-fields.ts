/** Parse / serialize fields giàu thông tin hồ sơ khách thuê–người làm. */

export function parseSkills(skillsJson: string | null | undefined): string[] {
  if (!skillsJson?.trim()) return [];
  try {
    const parsed = JSON.parse(skillsJson) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 12);
    }
  } catch {
    /* comma fallback */
  }
  return skillsJson
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function serializeSkills(skills: string[] | string | null | undefined): string | null {
  if (skills == null) return null;
  const list = Array.isArray(skills)
    ? skills
    : skills.split(',').map((s) => s.trim()).filter(Boolean);
  const clean = list.map((s) => s.trim()).filter(Boolean).slice(0, 12);
  return clean.length ? JSON.stringify(clean) : null;
}

export function parseWorkModes(raw: string | null | undefined): Array<'onsite' | 'online'> {
  const parts = (raw ?? 'onsite')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is 'onsite' | 'online' => s === 'onsite' || s === 'online');
  return parts.length ? [...new Set(parts)] : ['onsite'];
}

export function serializeWorkModes(
  modes: Array<'onsite' | 'online'> | string | null | undefined,
): string {
  if (modes == null || modes === '') return 'onsite';
  const list = Array.isArray(modes)
    ? modes
    : modes.split(',').map((s) => s.trim().toLowerCase());
  const clean = [...new Set(list.filter((s) => s === 'onsite' || s === 'online'))] as Array<
    'onsite' | 'online'
  >;
  return (clean.length ? clean : ['onsite']).join(',');
}

export function parseDistricts(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function serializeDistricts(districts: string[] | string | null | undefined): string | null {
  if (districts == null) return null;
  const list = Array.isArray(districts)
    ? districts
    : districts.split(',').map((s) => s.trim()).filter(Boolean);
  const clean = list.map((s) => s.trim()).filter(Boolean).slice(0, 20);
  return clean.length ? clean.join(', ') : null;
}

const MAX_GALLERY = 6;

function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Parse gallery portfolio URLs từ JSON. */
export function parseGallery(galleryJson: string | null | undefined): string[] {
  if (!galleryJson?.trim()) return [];
  try {
    const parsed = JSON.parse(galleryJson) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(String)
      .map((s) => s.trim())
      .filter((s) => s && isHttpUrl(s))
      .slice(0, MAX_GALLERY);
  } catch {
    return [];
  }
}

export function serializeGallery(
  urls: string[] | string | null | undefined,
): string | null {
  if (urls == null) return null;
  const list = Array.isArray(urls)
    ? urls
    : urls
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);
  const clean = [...new Set(list.map((s) => s.trim()).filter((s) => s && isHttpUrl(s)))].slice(
    0,
    MAX_GALLERY,
  );
  return clean.length ? JSON.stringify(clean) : null;
}
