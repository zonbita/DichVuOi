export type HomeShoutKind =
  | 'GREETING'
  | 'AVAILABLE'
  | 'PROMO'
  | 'LOOKING'
  | 'THANKS';

export type HomeShout = {
  id: string;
  kind: HomeShoutKind;
  kindLabel: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    level: number;
    acceptingJobs: boolean;
  };
  servicePost: {
    id: string;
    title: string;
    serviceName: string;
    serviceSlug: string;
    /** Slug nhóm catalog — màu nghề. */
    groupSlug?: string | null;
    href: string;
    profileHref: string;
  };
};

export type HomeLobbyReaction = {
  id: string;
  emoji: string;
  at: string;
  fromName: string | null;
  userId: string | null;
};

export type HomeLobbyViewer = {
  key: string;
  fullName: string;
  avatarUrl: string | null;
  userId: string | null;
  isGuest: boolean;
};

export type HomeLobbyPresence = {
  onlineCount: number;
  viewers: HomeLobbyViewer[];
};

export type HomeLobbyFeed = {
  items: HomeShout[];
  kinds: Array<{ kind: HomeShoutKind; label: string }>;
  smiles: string[];
};

/** Smile Facebook dạng chữ — bấm chat `:))` lên sảnh. */
export const DEFAULT_LOBBY_SMILES = [
  ':)',
  ':))',
  ':)))',
  ':D',
  '=))',
  ';)',
  ':P',
  ':*',
  '<3',
  ':(',
  ':((',
  ":'(",
  ':o',
  ':/',
  ':|',
  'B)',
  ':v',
  ':3',
  '3:)',
  'O:)',
  '@@',
  '-_-',
  '^_^',
  'T_T',
  ':x',
];
