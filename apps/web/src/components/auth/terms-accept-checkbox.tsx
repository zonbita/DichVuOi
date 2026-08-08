import { Link } from 'react-router-dom';

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  error?: string;
  id?: string;
};

/** Checkbox đồng ý Nội quy — dùng trên đăng nhập / đăng ký. */
export function TermsAcceptCheckbox({
  checked,
  onChange,
  error,
  id = 'accepted-terms',
}: Props) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--color-line)] text-[var(--color-brand)] focus:ring-[var(--color-brand)]"
        />
        <span className="text-[var(--color-muted)]">
          Tôi đã đọc, hiểu và đồng ý với{' '}
          <Link
            to="/noi-quy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--color-brand-deep)] underline underline-offset-2"
            onClick={(e) => e.stopPropagation()}
          >
            Nội quy và các quy tắc
          </Link>{' '}
          của Dịch Vụ Ơi.
        </span>
      </label>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
