import { forwardRef, useId, type FocusEvent, type Ref } from 'react';
import { Icon } from './icon';

type Props = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  min?: string;
  disabled?: boolean;
  className?: string;
  invalid?: boolean;
};

function formatDisplay(value: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const DatetimeLocalField = forwardRef(function DatetimeLocalField(
  {
    id,
    name,
    value,
    onChange,
    onBlur,
    min,
    disabled,
    className = '',
    invalid,
  }: Props,
  ref: Ref<HTMLInputElement>,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const display = formatDisplay(value);

  return (
    <label
      htmlFor={fieldId}
      className={`field-datetime group ${invalid ? 'is-invalid' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
    >
      <span className="field-datetime-face" aria-hidden>
        <span className="field-datetime-icon">
          <Icon name="calendar" className="h-[18px] w-[18px]" />
        </span>
        <span className={`field-datetime-value ${display ? '' : 'is-empty'}`}>
          {display ?? 'Chọn ngày và giờ'}
        </span>
        <span className="field-datetime-hint">Đổi lịch</span>
      </span>
      <input
        ref={ref}
        id={fieldId}
        name={name}
        type="datetime-local"
        value={value}
        min={min}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="field-datetime-input"
        aria-invalid={invalid || undefined}
      />
    </label>
  );
});
