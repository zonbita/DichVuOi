import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'span',
];

const SAFE_COLOR =
  /^(#([0-9a-f]{3}|[0-9a-f]{6})|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))$/i;

let hooksInstalled = false;

function ensureSanitizeHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;
  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName !== 'style') return;
    const raw = String(data.attrValue ?? '');
    const match = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(raw);
    const color = match?.[1]?.trim();
    if (color && SAFE_COLOR.test(color)) {
      data.attrValue = `color: ${color}`;
      return;
    }
    data.keepAttr = false;
  });
}

/** Sanitize HTML bài đăng — không cho link / script; chỉ cho style color. */
export function sanitizePostHtml(html: string): string {
  ensureSanitizeHooks();
  return DOMPurify.sanitize(html ?? '', {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['style'],
    FORBID_TAGS: ['a', 'script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['href', 'src', 'class', 'id', 'onclick', 'onerror'],
  });
}

/** Độ dài chữ thuần (bỏ tag) — dùng kiểm tra tối thiểu 20 ký tự. */
export function plainTextFromHtml(html: string): string {
  const cleaned = sanitizePostHtml(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}
