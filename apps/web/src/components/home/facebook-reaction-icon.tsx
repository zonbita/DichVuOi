/** Reaction Facebook (Like · Love · Care · Haha · Wow · Sad · Angry). */
export const FACEBOOK_REACTIONS = [
  'like',
  'love',
  'care',
  'haha',
  'wow',
  'sad',
  'angry',
] as const;

export type FacebookReactionId = (typeof FACEBOOK_REACTIONS)[number];

export const FACEBOOK_REACTION_LABEL: Record<FacebookReactionId, string> = {
  like: 'Thích',
  love: 'Yêu thích',
  care: 'Thương thương',
  haha: 'Haha',
  wow: 'Wow',
  sad: 'Buồn',
  angry: 'Phẫn nộ',
};

export function isFacebookReaction(value: string): value is FacebookReactionId {
  return (FACEBOOK_REACTIONS as readonly string[]).includes(value);
}

/** Icon sảnh: 7 reaction Facebook SVG, smile còn lại là emoji. */
export function LobbySmileIcon({
  id,
  className = 'h-8 w-8',
}: {
  id: string;
  className?: string;
}) {
  if (isFacebookReaction(id)) {
    return <FacebookReactionIcon id={id} className={className} />;
  }
  return (
    <span
      className={`inline-flex items-center justify-center leading-none ${className}`}
      aria-hidden
    >
      <span className="text-[1.35em]">{id}</span>
    </span>
  );
}

export function FacebookReactionIcon({
  id,
  className = 'h-8 w-8',
}: {
  id: FacebookReactionId;
  className?: string;
}) {
  switch (id) {
    case 'like':
      return <LikeIcon className={className} />;
    case 'love':
      return <LoveIcon className={className} />;
    case 'care':
      return <CareIcon className={className} />;
    case 'haha':
      return <HahaIcon className={className} />;
    case 'wow':
      return <WowIcon className={className} />;
    case 'sad':
      return <SadIcon className={className} />;
    case 'angry':
      return <AngryIcon className={className} />;
  }
}

function LikeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#2078F4" />
      <path
        fill="#fff"
        d="M13.1 25.2H8.6c-.7 0-1.2-.5-1.2-1.2v-8.4c0-.7.5-1.2 1.2-1.2h4.5v10.8zm10.4-10.6c.6 0 1.1.5 1.1 1.2 0 .3-.1.6-.3.8.3.2.5.6.5 1 0 .5-.3.9-.7 1.1.2.2.3.5.3.8 0 .6-.4 1.1-1 1.2v.1c0 .6-.5 1.1-1.1 1.1h-3.3c-.4 0-.8.1-1.1.3l-.6.5c-.3.2-.6.3-1 .3h-.9V14.4l1.6-3.1c.2-.5.7-.8 1.2-.8h.5c.7 0 1.2.5 1.2 1.2v2.9h3.6z"
      />
    </svg>
  );
}

function LoveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#F33E58" />
      <path
        fill="#fff"
        d="M16 24.2s-7.2-4.4-7.2-8.7c0-2.3 1.8-4.1 4.1-4.1 1.4 0 2.6.7 3.1 1.8.5-1.1 1.7-1.8 3.1-1.8 2.3 0 4.1 1.8 4.1 4.1 0 4.3-7.2 8.7-7.2 8.7z"
      />
    </svg>
  );
}

function CareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#F7B125" />
      <ellipse cx="11.2" cy="13.2" rx="1.35" ry="1.7" fill="#5B3A1A" />
      <ellipse cx="20.8" cy="13.2" rx="1.35" ry="1.7" fill="#5B3A1A" />
      <path
        fill="#F33E58"
        d="M16 23.6s-4.4-2.7-4.4-5.3c0-1.4 1.1-2.5 2.5-2.5.8 0 1.6.4 2 1.1.4-.7 1.1-1.1 2-1.1 1.4 0 2.5 1.1 2.5 2.5 0 2.6-4.6 5.3-4.6 5.3z"
      />
      <path
        fill="none"
        stroke="#5B3A1A"
        strokeWidth="1.15"
        strokeLinecap="round"
        d="M8.4 20.2c1.6 1.6 3.7 2.2 5.2 1.4"
      />
      <path
        fill="none"
        stroke="#5B3A1A"
        strokeWidth="1.15"
        strokeLinecap="round"
        d="M23.6 20.2c-1.6 1.6-3.7 2.2-5.2 1.4"
      />
    </svg>
  );
}

function HahaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#F7B125" />
      <path
        fill="#5B3A1A"
        d="M7.6 12.4c1.6-1.6 3.5-2.3 4.6-1.7.3.2.4.5.2.9-.8 1.6-2.4 2.6-4.2 2.6-.4 0-.7-.3-.6-.7v-1.1zm16.8 0c-1.6-1.6-3.5-2.3-4.6-1.7-.3.2-.4.5-.2.9.8 1.6 2.4 2.6 4.2 2.6.4 0 .7-.3.6-.7v-1.1z"
      />
      <path
        fill="#5B3A1A"
        d="M8.2 17.6c0-.6.5-1 1-1h13.6c.6 0 1 .4 1 1 0 4.2-3.5 7.2-7.8 7.2S8.2 21.8 8.2 17.6z"
      />
      <path
        fill="#fff"
        d="M10.4 18.4h11.2c.1 2.8-2.3 5.2-5.6 5.2s-5.7-2.4-5.6-5.2z"
      />
    </svg>
  );
}

function WowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#F7B125" />
      <ellipse cx="10.8" cy="13" rx="2.1" ry="2.6" fill="#5B3A1A" />
      <ellipse cx="21.2" cy="13" rx="2.1" ry="2.6" fill="#5B3A1A" />
      <ellipse cx="16" cy="21.4" rx="3.1" ry="3.8" fill="#5B3A1A" />
      <ellipse cx="16" cy="21.1" rx="1.7" ry="2.1" fill="#fff" opacity=".35" />
    </svg>
  );
}

function SadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#F7B125" />
      <ellipse cx="11" cy="13.4" rx="1.5" ry="1.9" fill="#5B3A1A" />
      <ellipse cx="21" cy="13.4" rx="1.5" ry="1.9" fill="#5B3A1A" />
      <path
        fill="none"
        stroke="#5B3A1A"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M11.2 22.4c1.4-1.6 3-2.4 4.8-2.4s3.4.8 4.8 2.4"
      />
      <path
        fill="#68B5E8"
        d="M22.6 16.8c0 1.5-.9 2.4-1.8 2.4s-1.7-.9-1.7-2.4c.5-1.7 1.7-3.4 1.7-3.4s1.8 1.7 1.8 3.4z"
      />
    </svg>
  );
}

function AngryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#E9710F" />
      <path
        fill="#5B3A1A"
        d="M8.2 10.4c2.2.2 4.1 1.1 5.2 2.3.3.3.1.8-.3.8H8.6c-.5 0-.8-.5-.4-.9zm15.6 0c-2.2.2-4.1 1.1-5.2 2.3-.3.3-.1.8.3.8h4.5c.5 0 .8-.5.4-.9z"
      />
      <circle cx="11.2" cy="15.2" r="1.7" fill="#5B3A1A" />
      <circle cx="20.8" cy="15.2" r="1.7" fill="#5B3A1A" />
      <path
        fill="#5B3A1A"
        d="M11.4 22.8c1.3-1.4 2.9-2.1 4.6-2.1s3.3.7 4.6 2.1c.3.3 0 .8-.4.8H11.8c-.4 0-.7-.5-.4-.8z"
      />
    </svg>
  );
}
