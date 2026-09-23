import type { Arena, ScreenKind } from "./rules";

export type Role = "artist" | "scout";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  username: string;
  displayName: string;
  role: Role;
  cashtag: string;
  paypalEmail: string;
  bio: string;
  createdAt: string;
  freePasses: number;
  earnedFoundingPass: boolean;
  disabled?: boolean;
  links: ArtistLinks;
};

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: Role;
  cashtag: string;
  paypalEmail: string;
  freePasses: number;
  earnedFoundingPass: boolean;
};

export type ArtistLinks = {
  instagram: string;
  tiktok: string;
  facebook: string;
  youtube: string;
  spotify: string;
  appleMusic: string;
  other: string;
};

export const EMPTY_LINKS: ArtistLinks = {
  instagram: "",
  tiktok: "",
  facebook: "",
  youtube: "",
  spotify: "",
  appleMusic: "",
  other: "",
};

export type EntryStatus = "draft" | "paid" | "removed";

export type Entry = {
  id: string;
  slug: string;
  userId: string;
  arena: Arena;
  screenKind: ScreenKind | null;
  title: string;
  genre: string;
  logline: string;
  coverPath: string;
  mediaPath: string | null;
  durationSeconds: number;
  hookStartSeconds: number;
  bytes: number;
  status: EntryStatus;
  weekId: string;
  createdAt: string;
  paidAt: string | null;
  stripeSessionId: string | null;
  potCents: number;
  houseCents: number;
  feeCents: number;
  fanCents: number;
  scoutKeeps: number;
  scoutPasses: number;
  heatVotes: number;
  playCount: number;
  links: ArtistLinks;
};

export type VoteKind = "scout" | "heat";

export type Vote = {
  id: string;
  entryId: string;
  kind: VoteKind;
  keep: boolean;
  voterId: string;
  userId: string | null;
  ipHash: string;
  createdAt: string;
};

export type WeekStatus = "open" | "closed";

export type Week = {
  id: string;
  arena: Arena;
  status: WeekStatus;
  openedAt: string;
  closedAt: string | null;
  entryCount: number;
  potCents: number;
  cutWinnerIds: string[];
  heatWinnerId: string | null;
};

export type FanWeek = {
  weekId: string;
  status: WeekStatus;
  openedAt: string;
  closedAt: string | null;
  potCents: number;
  winnerIds: string[];
};

export type PayoutStatus = "pending" | "sent" | "void";

export type Payout = {
  id: string;
  weekId: string;
  arena: Arena;
  place: "cut-1" | "cut-2" | "heat" | "fan-1" | "fan-2" | "fan-3";
  entryId: string;
  userId: string;
  cashtag: string;
  paypalEmail: string;
  amountCents: number;
  status: PayoutStatus;
  sentAt: string | null;
  note: string;
};

export type FoundingPass = {
  code: string;
  userId: string;
  username: string;
  email: string;
  displayName: string;
  awardedAt: string;
  entryId: string | null;
  usedAt: string | null;
};

export type Store = {
  users: User[];
  entries: Entry[];
  votes: Vote[];
  weeks: Week[];
  payouts: Payout[];
  fanWeeks: FanWeek[];
  houseCents: number;
  /** When false, entries are free and no prize money is collected. Flip on in /admin. */
  chargesLive: boolean;
  chargesLiveAt: string | null;
  foundingPassCount: number;
  foundingPasses: FoundingPass[];
  weeklyGiveaway: {
    weekId: string;
    userId: string | null;
    username: string;
    displayName: string;
  } | null;
};
