import { sanitizePostHtml } from '../../utils/sanitize-post-html';

/** Hiển thị HTML bài đăng đã sanitize (hoặc plain text cũ). Không kéo TipTap. */
export function RichPostBody({ html }: { html: string }) {
  const looksHtml = /<\/?[a-z][\s\S]*>/i.test(html);
  if (!looksHtml) {
    return (
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--color-ink)]">
        {html}
      </p>
    );
  }
  return (
    <div
      className="simple-rich-content text-[15px] leading-relaxed text-[var(--color-ink)]"
      dangerouslySetInnerHTML={{ __html: sanitizePostHtml(html) }}
    />
  );
}
