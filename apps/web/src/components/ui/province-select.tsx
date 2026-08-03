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
      <label
        className="mb-2 block text-sm font-medium text-[#0F2F4A]"
        htmlFor={id}
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-[12px] border border-[#DCE6EC] bg-white px-3 text-sm text-[#0F2F4A] outline-none transition focus:border-[#079A9A] focus:ring-2 focus:ring-[#13B8B0]/25 disabled:opacity-60"
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
