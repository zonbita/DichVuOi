import { useState } from 'react';

type Props = {
  value: string[];
  onChange: (tasks: string[]) => void;
  disabled?: boolean;
};

/** Checklist lúc tạo đơn — sau khi đăng không thêm được nữa. */
export function HireTasksInput({ value, onChange, disabled }: Props) {
  const [draft, setDraft] = useState('');

  function addTask() {
    const content = draft.trim();
    if (content.length < 2 || disabled) return;
    if (value.some((t) => t.toLowerCase() === content.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...value, content.slice(0, 500)]);
    setDraft('');
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <ul className="space-y-1.5">
          {value.map((task, index) => (
            <li
              key={`${index}-${task.slice(0, 24)}`}
              className="flex items-start gap-2 rounded-lg border border-[var(--color-line)] px-3 py-2"
            >
              <span className="mt-0.5 text-xs font-bold text-[var(--color-muted)]">
                {index + 1}.
              </span>
              <span className="min-w-0 flex-1 text-sm text-[var(--color-ink)]">
                {task}
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeAt(index)}
                className="shrink-0 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={draft}
          disabled={disabled}
          maxLength={500}
          aria-label="Công việc cần làm"
          placeholder="Vd. Lau kính cửa sổ…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTask();
            }
          }}
          className="field-input min-w-0 flex-1"
        />
        <button
          type="button"
          disabled={disabled || draft.trim().length < 2}
          onClick={addTask}
          className="rounded-lg bg-[var(--color-brand-deep)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Thêm
        </button>
      </div>
    </div>
  );
}
