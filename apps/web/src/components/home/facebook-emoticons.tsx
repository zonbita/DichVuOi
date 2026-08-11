import type { ReactNode } from 'react';
import {
  FacebookReactionIcon,
  type FacebookReactionId,
} from './facebook-reaction-icon';

export type FacebookEmoticon = {
  code: string;
  label: string;
  face: FacebookReactionId | 'smile' | 'wink' | 'tongue' | 'cool' | 'neutral';
};

/** Bộ smile Facebook (chữ) — bấm là chat `:))` lên sảnh. */
export const FACEBOOK_EMOTICONS: FacebookEmoticon[] = [
  { code: ':)', label: 'Cười', face: 'smile' },
  { code: ':))', label: 'Cười to', face: 'haha' },
  { code: ':)))', label: 'Cười lớn', face: 'haha' },
  { code: ':D', label: 'Cười tươi', face: 'haha' },
  { code: '=))', label: 'Cười sảng', face: 'haha' },
  { code: ';)', label: 'Nháy mắt', face: 'wink' },
  { code: ':P', label: 'Lè lưỡi', face: 'tongue' },
  { code: ':*', label: 'Hôn', face: 'care' },
  { code: '<3', label: 'Tym', face: 'love' },
  { code: ':(', label: 'Buồn', face: 'sad' },
  { code: ':((', label: 'Khóc', face: 'sad' },
  { code: ":'(", label: 'Khóc', face: 'sad' },
  { code: ':o', label: 'Ngạc nhiên', face: 'wow' },
  { code: ':/', label: 'Bối rối', face: 'neutral' },
  { code: ':|', label: 'Đơ', face: 'neutral' },
  { code: 'B)', label: 'Ngầu', face: 'cool' },
  { code: ':v', label: 'Pacman', face: 'tongue' },
  { code: ':3', label: 'Mèo', face: 'care' },
  { code: '3:)', label: 'Quỷ', face: 'angry' },
  { code: 'O:)', label: 'Thiên thần', face: 'care' },
  { code: '@@', label: 'Hoa mắt', face: 'wow' },
  { code: '-_-', label: 'Chán', face: 'neutral' },
  { code: '^_^', label: 'Vui', face: 'smile' },
  { code: 'T_T', label: 'Khóc', face: 'sad' },
  { code: ':x', label: 'Ngại', face: 'care' },
];

export const FACEBOOK_EMOTICON_CODES = FACEBOOK_EMOTICONS.map((item) => item.code);

export function FacebookEmoticonIcon({
  face,
  className = 'h-8 w-8',
}: {
  face: FacebookEmoticon['face'];
  className?: string;
}) {
  switch (face) {
    case 'smile':
      return <SmileFace className={className} />;
    case 'wink':
      return <WinkFace className={className} />;
    case 'tongue':
      return <TongueFace className={className} />;
    case 'cool':
      return <CoolFace className={className} />;
    case 'neutral':
      return <NeutralFace className={className} />;
    default:
      return <FacebookReactionIcon id={face} className={className} />;
  }
}

function FaceBase({
  className,
  children,
  fill = '#F7B125',
}: {
  className?: string;
  children: ReactNode;
  fill?: string;
}) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" fill={fill} />
      {children}
    </svg>
  );
}

function SmileFace({ className }: { className?: string }) {
  return (
    <FaceBase className={className}>
      <circle cx="11" cy="13.2" r="1.6" fill="#5B3A1A" />
      <circle cx="21" cy="13.2" r="1.6" fill="#5B3A1A" />
      <path
        fill="none"
        stroke="#5B3A1A"
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M10.4 19.4c1.6 2.2 3.6 3.2 5.6 3.2s4-1 5.6-3.2"
      />
    </FaceBase>
  );
}

function WinkFace({ className }: { className?: string }) {
  return (
    <FaceBase className={className}>
      <circle cx="11" cy="13.4" r="1.6" fill="#5B3A1A" />
      <path
        fill="none"
        stroke="#5B3A1A"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M18.4 13.6h5.2"
      />
      <path
        fill="none"
        stroke="#5B3A1A"
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M10.6 19.6c1.5 2 3.4 2.9 5.4 2.9s3.9-.9 5.4-2.9"
      />
    </FaceBase>
  );
}

function TongueFace({ className }: { className?: string }) {
  return (
    <FaceBase className={className}>
      <circle cx="11" cy="13" r="1.6" fill="#5B3A1A" />
      <circle cx="21" cy="13" r="1.6" fill="#5B3A1A" />
      <path
        fill="#5B3A1A"
        d="M9.6 18.2h12.8c0 1.2-.6 2.2-1.4 2.2h-4.2v2.6c0 1.3-1.1 1.9-2 1.9s-2-.6-2-1.9v-2.6h-1.8c-.8 0-1.4-1-1.4-2.2z"
      />
      <path fill="#E94B7A" d="M14.4 20.4h3.2v2.4c0 .9-.7 1.4-1.6 1.4s-1.6-.5-1.6-1.4v-2.4z" />
    </FaceBase>
  );
}

function CoolFace({ className }: { className?: string }) {
  return (
    <FaceBase className={className}>
      <rect x="6.4" y="11.4" width="19.2" height="5.2" rx="2.4" fill="#2B2B2B" />
      <rect x="7.2" y="12.2" width="7.4" height="3.6" rx="1.6" fill="#5B3A1A" />
      <rect x="17.4" y="12.2" width="7.4" height="3.6" rx="1.6" fill="#5B3A1A" />
      <path
        fill="none"
        stroke="#5B3A1A"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M11.2 21.2c1.4 1.4 3.1 2 4.8 2s3.4-.6 4.8-2"
      />
    </FaceBase>
  );
}

function NeutralFace({ className }: { className?: string }) {
  return (
    <FaceBase className={className}>
      <circle cx="11" cy="13.2" r="1.5" fill="#5B3A1A" />
      <circle cx="21" cy="13.2" r="1.5" fill="#5B3A1A" />
      <path
        fill="none"
        stroke="#5B3A1A"
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M11.2 21.2h9.6"
      />
    </FaceBase>
  );
}
