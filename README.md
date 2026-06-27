# Wordle Open
A lightweight backend service for a Wordle clone game, featuring a full authentication system and persistent game state tracking.

## Current Status & Features
- **Core Game Loop:** Word validation, guess feedback (green/yellow/gray), remaining guess tracking, and win/loss detection.
- **Game Modes:** Easy and Hard difficulty, each with separate word pools and independent streak tracking.
- **Streak Tracking:** Per-user win streaks tracked separately for Easy and Hard modes, updated atomically on game completion.
- **Authentication:** Custom email/password system with email verification via Nodemailer. Issues signed access and refresh tokens as `httpOnly` cookies, with token rotation and per-device or all-device logout support.
- **Database:** Structured with **Prisma ORM** for type safety and clean data mapping.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database Wrapper:** Prisma ORM
- **Database:** PostgreSQL
- **Auth:** JWT (httpOnly cookies) + Bcrypt
- **Email:** Nodemailer

## Branch Information
- `main`: Current branch. Stable working base with local email/password auth and Nodemailer for email verification.
- `oauth-refactor`: Drops custom email delivery in favour of third-party OAuth providers (Google/Discord).

## API Overview

### Auth — `/user`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/user/register` | Initiate registration, sends verification email |
| POST | `/user/register/verify` | Verify code and create account |
| POST | `/user/login` | Login and issue session cookies |
| POST | `/user/logout` | Revoke current device's refresh token |
| POST | `/user/logout/all` | Revoke all refresh tokens across devices |
| POST | `/user/token/rotate` | Rotate access and refresh tokens |

### Game — `/games` 🔒 (requires auth)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/games` | Get all games for current user |
| POST | `/games` | Start a new game |
| GET | `/games/:gameID` | Get a specific game |
| POST | `/games/:gameID/guess` | Submit a guess |
| POST | `/games/:gameID/skip` | Skip current game and start next |
| DELETE | `/games/:gameID` | Delete a game |

## Setup & Installation

1. **Clone the project:**
```bash
git clone https://github.com/Vyombudha/wordle-backend.git
cd wordle-backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**

Create a `.env` file in the root directory:
```bash
DATABASE_URL="your-database-connection-string"
NODE_ENV="development"

JWT_ACCESS_SECRET="your-access-token-secret"
JWT_REFRESH_SECRET="your-refresh-token-secret"

SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-email"
SMTP_PASS="your-email-password"
```

4. **Run database migrations:**
```bash
npx prisma migrate dev
```

5. **Start dev server:**
```bash
npm run dev
```