import { useMemo } from 'react';
import type { OfferingOption } from './constants';

export function ProfessionSelect({
  offerings,
  value,
  onChange,
  includeAll,
  required,
}: {
  offerings: OfferingOption[];
  value: string;
  onChange: (id: string) => void;
  includeAll?: boolean;
  required?: boolean;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, { groupName: string; items: OfferingOption[] }>();
    for (const o of offerings) {
      const key = o.groupSlug || o.groupName || 'khac';
      const entry = map.get(key) ?? { groupName: o.groupName || 'Khác', items: [] };
      entry.items.push(o);
      map.set(key, entry);
    }
    return Array.from(map.values()).map((g) => ({
      ...g,
      items: [...g.items].sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    }));
  }, [offerings]);

  return (
    <select
      className="field-input mt-1 w-full py-2.5"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    >
      {includeAll ? <option value="all">Tất cả nghề</option> : null}
      {!includeAll ? (
        <option value="" disabled>
          Chọn nghề…
        </option>
      ) : null}
      {grouped.map((group) => (
        <optgroup key={group.groupName} label={group.groupName}>
          {group.items.map((item) => (
            <option key={item.serviceId} value={item.serviceId}>
              {item.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
