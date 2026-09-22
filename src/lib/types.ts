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
  /** PayPal email for winnings (optional). */
  paypalEmail: string;
  bio: string;
  createdAt: string;
};

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: Role;
  cashtag: string;
  paypalEmail: string;
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
  scoutKeeps: number;
  scoutPasses: number;
  heatVotes: number;
  playCount: number;
};

export type VoteKind = "scout" | "heat";

export type Vote = {
  id: string;
  entryId: string;
  kind: VoteKind;
  keep: boolean;
  voterId: string;
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

export type PayoutStatus = "pending" | "sent" | "void";

export type Payout = {
  id: string;
  weekId: string;
  arena: Arena;
  place: "cut-1" | "cut-2" | "heat";
  entryId: string;
  userId: string;
  cashtag: string;
  paypalEmail: string;
  amountCents: number;
  status: PayoutStatus;
  sentAt: string | null;
  note: string;
};

export type Store = {
  users: User[];
  entries: Entry[];
  votes: Vote[];
  weeks: Week[];
  payouts: Payout[];
  houseCents: number;
  /** When false, entries are free and no prize money is collected. Flip on in /admin. */
  chargesLive: boolean;
  chargesLiveAt: string | null;
};
