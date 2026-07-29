import { PROVINCES } from '../../data/provinces';

type Props = {
  id?: string;
  value: string;
  onChange: (provinceName: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
};

/** Select 34 tỉnh/thành (README «Tỉnh / thành») — lưu `Province.name`. */
export function ProvinceSelect({
  id = 'province-select',
  value,
  onChange,
  disabled,
  error,
  label = 'Địa chỉ / khu vực phục vụ',
}: Props) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="field-input w-full"
      >
        <option value="">Chọn tỉnh / thành phố…</option>
        {PROVINCES.map((province) => (
          <option key={province.slug} value={province.name}>
            {province.name}
            {province.kind === 'city' ? ' (TP)' : ''}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
