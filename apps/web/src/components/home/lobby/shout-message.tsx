import type { HomeShoutKind } from '../../../types/home-lobby';
import { offeringColor } from '../../../utils/catalog-colors';
import { Icon } from '../../ui/icon';
import { kindRainbowColor } from './lobby-utils';

/** Câu hô = màu loại (cầu vồng); chip nghề = offeringColor. */
export function ShoutMessage({
  message,
  groupSlug,
  kind,
}: {
  message: string;
  groupSlug?: string | null;
  kind: HomeShoutKind;
}) {
  const profession = offeringColor(groupSlug);
  const kindColor = kindRainbowColor(kind);
  const parts = message.split(/(«[^»]+»)/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = /^«(.+)»$/.exec(part);
        if (!match) {
          return (
            <span key={i} className="font-semibold" style={{ color: kindColor }}>
              {part}
            </span>
          );
        }
        return (
          <span
            key={i}
            className="mx-0.5 inline-flex max-w-full items-center gap-1 align-middle rounded-md px-1.5 py-0.5 font-semibold"
            style={{
              backgroundColor: profession.soft,
              color: profession.ink,
            }}
          >
            <Icon
              name="briefcase"
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: profession.main }}
            />
            <span className="truncate">{match[1]}</span>
          </span>
        );
      })}
    </>
  );
}
