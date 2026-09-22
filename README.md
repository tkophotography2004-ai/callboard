# Callboard

Standalone ranking floor for music and short video. Winners paid on **Cash App**.

## Two products

| Board | Price | House keeps | After Stripe, into the pot | Identity |
|---|---|---|---|---|
| **Blind** | $20 | $12 | ~$7.12 | Name locked until the week closes |
| **Tracks** | $5 | $2 | ~$2.55 | Named |
| **Videos** | $5 | $2 | ~$2.55 | Named, under 2 minutes |

Caps: 1 Blind per 24 hours. 3 combined $5 entries (tracks + videos) per 24 hours.

**Pot switch:** `/admin` has **Turn pot & charges on**. Until you flip it, entries are free, judging still runs, and no Stripe charge is taken. Founding cuts already on the board are not billed when you open the pot.

## Why Keep / Pass, not clicks

Clicks measure a following. A group chat, a bot, or a skip all count the same as someone who sat with the hook. Keep / Pass is one question after they listen: would you leave it on? Blind strips the artist name so nobody can campaign “vote for me.” Wilson scoring means 3/3 does not beat 40/50.

Share counts on the $5 boards are shown. They never rank the pot.

Payouts: 70% Cut #1, 30% Cut #2. Under $10, Cut #1 takes the whole pot.

## Run locally

```bat
cd C:\Users\tinaa\callboard
START.bat
```

http://localhost:3200 — demo `nova@callboard.app` / `callboard` — admin `/admin` password `callboard`

Stripe live keys are in `.env.local`. Checkout is card or Cash App Pay.

**Link only:** no file uploads until storage is paid for. Music lounges take YouTube / SoundCloud / Spotify / Audiomack. Video lounges take YouTube / TikTok / Instagram / Vimeo.

**Payouts:** `/admin` has the Sunday payout checklist. Weeks close Sunday 23:59 UTC. You still send Cash App yourself and mark sent (within 10 days of the crown).

## Crate (separate playlist app)

Crate lives at `C:\Users\tinaa\crate` on http://localhost:3060. It is not this repo. Scroll Call admin can **Send winners to Crate** so crowned music cuts add free. Other artists pay Crate to be added.

```
CRATE_URL=http://localhost:3060
CRATE_INTAKE_SECRET=callboard-dev-secret-change-me
```
