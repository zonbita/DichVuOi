import { Link } from 'react-router-dom';
import type { PartnerProfile } from '../../types/auth';

type ChecklistItem = {
  key: string;
  label: string;
  done: boolean;
};

function buildChecklist(profile: PartnerProfile): ChecklistItem[] {
  const skills =
    profile.skills?.length ??
    (() => {
      try {
        const parsed = profile.skillsJson ? JSON.parse(profile.skillsJson) : [];
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    })();

  const districts =
    profile.districtsList?.length ??
    (profile.districts
      ? profile.districts.split(',').map((s) => s.trim()).filter(Boolean).length
      : 0);

  const offerings = profile.offerings?.length ?? profile.serviceIds?.length ?? 0;
  const gallery = profile.gallery?.length ?? 0;
  const avatarCustom =
    Boolean(profile.avatarUrl) &&
    !profile.avatarUrl?.includes('api.dicebear.com') &&
    !profile.avatarUrl?.includes('pravatar');

  return [
    { key: 'headline', label: 'Headline', done: Boolean(profile.headline?.trim()) },
    { key: 'bio', label: 'Giới thiệu', done: Boolean(profile.bio && profile.bio.trim().length >= 40) },
    { key: 'districts', label: 'Quận / khu vực', done: districts > 0 },
    { key: 'skills', label: 'Kỹ năng', done: skills > 0 },
    { key: 'offerings', label: 'Nghề đang nhận', done: offerings > 0 },
    { key: 'avatar', label: 'Ảnh đại diện riêng', done: avatarCustom },
    { key: 'gallery', label: 'Portfolio (≥3 ảnh)', done: gallery >= 3 },
  ];
}

type Props = {
  profile: PartnerProfile;
};

export function PartnerCompletenessBar({ profile }: Props) {
  const items = buildChecklist(profile);
  const doneCount = items.filter((i) => i.done).length;
  const percent = Math.round((doneCount / items.length) * 100);
  const missing = items.filter((i) => !i.done);

  if (percent >= 100) {
    return (
      <div className="glass-card !rounded-2xl border-emerald-200/60 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900">
        <p className="font-bold">Hồ sơ hoàn thiện 100%</p>
        <p className="mt-0.5 text-emerald-800/80">
          Khách thấy đủ thông tin tin cậy — tiếp tục nhận việc trên hàng chờ.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card !rounded-2xl px-4 py-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-extrabold">Hồ sơ hoàn thiện {percent}%</p>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            Bổ sung để khách tin và thuê nhanh hơn.
          </p>
        </div>
        <Link
          to="/doi-tac/ho-so"
          className="text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
        >
          Cập nhật hồ sơ
        </Link>
      </div>
      <div className="mt-3 h-2 overflow-hidden bg-[var(--color-canvas)] ring-1 ring-[var(--color-line)]">
        <div
          className="h-full bg-[var(--color-brand)] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      {missing.length ? (
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Còn thiếu: {missing.map((m) => m.label).join(' · ')}
        </p>
      ) : null}
    </div>
  );
}
