import { Color } from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './icon';
import { plainTextFromHtml, sanitizePostHtml } from '../../utils/sanitize-post-html';

const TEXT_COLORS = [
  { value: '#0F172A', label: 'Đen' },
  { value: '#475569', label: 'Xám' },
  { value: '#079A9A', label: 'Teal' },
  { value: '#0F2F4A', label: 'Navy' },
  { value: '#DC2626', label: 'Đỏ' },
  { value: '#D97706', label: 'Cam' },
  { value: '#16A34A', label: 'Xanh lá' },
  { value: '#2563EB', label: 'Xanh dương' },
  { value: '#7C3AED', label: 'Tím' },
] as const;

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minPlainLength?: number;
};

type ToolbarBtn = {
  label: string;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function ToolbarButton({ label, title, active, disabled, onClick }: ToolbarBtn) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`rounded-md px-2.5 py-1.5 text-sm font-bold transition ${
        active
          ? 'bg-[var(--color-ink)] text-white'
          : 'text-[var(--color-ink)] hover:bg-[var(--color-brand-soft)]'
      } disabled:opacity-40`}
    >
      {label}
    </button>
  );
}

/** Editor kiểu WordPress (toolbar + nội dung) — không có chèn link. */
export function SimpleRichEditor({
  value,
  onChange,
  placeholder = 'Viết nội dung bài đăng…',
  minPlainLength = 20,
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
        code: false,
        codeBlock: false,
      }),
      TextStyle,
      Color,
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class:
          'simple-rich-editor min-h-[200px] max-h-[420px] overflow-y-auto px-3 py-3 text-[15px] leading-relaxed outline-none',
      },
      transformPastedHTML: (html) => sanitizePostHtml(html),
    },
    onUpdate: ({ editor: ed }) => {
      onChange(sanitizePostHtml(ed.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = sanitizePostHtml(editor.getHTML());
    const next = sanitizePostHtml(value || '<p></p>');
    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  const [colorOpen, setColorOpen] = useState(false);
  const colorRootRef = useRef<HTMLDivElement>(null);
  const activeColor =
    (editor?.getAttributes('textStyle').color as string | undefined) || '#0F172A';

  useEffect(() => {
    if (!colorOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!colorRootRef.current?.contains(event.target as Node)) {
        setColorOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [colorOpen]);

  if (!editor) {
    return (
      <div className="mt-1 min-h-[240px] animate-pulse rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)]" />
    );
  }

  const plainLen = plainTextFromHtml(value).length;

  function applyColor(color: string | null) {
    if (!editor) return;
    if (color) editor.chain().focus().setColor(color).run();
    else editor.chain().focus().unsetColor().run();
    setColorOpen(false);
  }

  return (
    <div className="mt-1 overflow-hidden rounded-xl border border-[var(--color-line)] bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--color-line)] bg-[var(--color-canvas)] px-2 py-1.5">
        <ToolbarButton
          label="B"
          title="In đậm"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="I"
          title="In nghiêng"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="U"
          title="Gạch dưới"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          label="S"
          title="Gạch ngang"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <div ref={colorRootRef} className="relative mx-0.5">
          <button
            type="button"
            title="Màu chữ"
            aria-label="Màu chữ"
            aria-expanded={colorOpen}
            onMouseDown={(e) => {
              e.preventDefault();
              setColorOpen((open) => !open);
            }}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-brand-soft)]"
          >
            <span
              className="h-4 w-4 rounded-sm border border-[var(--color-line)]"
              style={{ backgroundColor: activeColor }}
            />
            A
            <Icon name="chevronDown" className="h-3 w-3 text-[var(--color-muted)]" />
          </button>
          {colorOpen ? (
            <div className="absolute left-0 top-full z-20 mt-1 min-w-[11rem] rounded-xl border border-[var(--color-line)] bg-white p-2 shadow-[var(--shadow-card)]">
              <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-muted)]">
                Màu chữ
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    aria-label={c.label}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyColor(c.value);
                    }}
                    className={`h-7 w-7 rounded-md border ${
                      activeColor.toLowerCase() === c.value.toLowerCase()
                        ? 'border-[var(--color-ink)] ring-2 ring-[var(--color-brand)]/40'
                        : 'border-[var(--color-line)]'
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2 border-t border-[var(--color-line)] pt-2">
                <label className="inline-flex flex-1 cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-xs font-semibold hover:bg-[var(--color-canvas)]">
                  <input
                    type="color"
                    value={/^#[0-9a-f]{6}$/i.test(activeColor) ? activeColor : '#0F172A'}
                    className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => applyColor(e.target.value)}
                  />
                  Tuỳ chọn
                </label>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-xs font-bold text-[var(--color-muted)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyColor(null);
                  }}
                >
                  Xóa màu
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <span className="mx-1 h-5 w-px bg-[var(--color-line)]" aria-hidden />
        <ToolbarButton
          label="H2"
          title="Tiêu đề lớn"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          label="H3"
          title="Tiêu đề nhỏ"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <span className="mx-1 h-5 w-px bg-[var(--color-line)]" aria-hidden />
        <ToolbarButton
          label="• List"
          title="Danh sách dấu đầu dòng"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="1. List"
          title="Danh sách đánh số"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="“ ”"
          title="Trích dẫn"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <ToolbarButton
          label="—"
          title="Đường kẻ ngang"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
        <span className="mx-1 h-5 w-px bg-[var(--color-line)]" aria-hidden />
        <button
          type="button"
          title="Hoàn tác"
          aria-label="Hoàn tác"
          disabled={!editor.can().undo()}
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().undo().run();
          }}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-brand-soft)] disabled:opacity-40"
        >
          <Icon name="rotateCcw" className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Làm lại"
          aria-label="Làm lại"
          disabled={!editor.can().redo()}
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().redo().run();
          }}
          className="rounded-md px-2.5 py-1.5 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-brand-soft)] disabled:opacity-40"
        >
          ↻
        </button>
      </div>
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between border-t border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-muted)]">
        <span>Không hỗ trợ chèn link</span>
        <span className={plainLen < minPlainLength ? 'text-amber-700' : ''}>
          {plainLen}/{minPlainLength}+ ký tự
        </span>
      </div>
    </div>
  );
}

/** Hiển thị HTML bài đăng đã sanitize (hoặc plain text cũ). */
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
