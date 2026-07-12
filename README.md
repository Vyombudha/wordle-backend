# Wordle Open

A lightweight backend service for a Wordle clone game, featuring a complete authentication system, persistent game state tracking, security-focused API design, and comprehensive integration testing.

## Current Status & Features

* **Core Game Loop:** Word validation, Wordle-style guess feedback (green/yellow/gray), remaining guess tracking, win/loss detection, and game completion handling.

* **Game Modes:** Supports Easy and Hard difficulty modes with separate word pools and independent streak tracking.

* **Streak Tracking:** Per-user win streaks tracked separately by game mode and updated transactionally when games are completed.

* **Authentication:**

  * Custom email/password authentication.
  * Email verification flow using Nodemailer.
  * JWT-based sessions stored as `httpOnly` cookies.
  * Access token + refresh token architecture.
  * Refresh token rotation with reuse detection.
  * Per-device logout and global logout support.

* **Security:**

  * Protected routes using authentication middleware.
  * Ownership checks preventing IDOR attacks.
  * Rate limiting on authentication and gameplay endpoints.
  * Server-side validation for user input and game state.

* **Database:**

  * PostgreSQL database.
  * Prisma ORM for type-safe database access and schema management.

* **Testing:**

  * End-to-end API tests using Vitest and Supertest.
  * Real database interaction through Prisma.
  * Real JWT verification and bcrypt hashing.
  * Authentication flow coverage.
  * Authorization and IDOR protection tests.

* **Documentation:**

  * OpenAPI 3.0 API specification.
  * Interactive Swagger API documentation.

## Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Language:** JavaScript (ES Modules)
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Authentication:** JWT (`httpOnly` cookies) + Bcrypt
* **Email:** Nodemailer
* **Testing:** Vitest + Supertest
* **API Documentation:** OpenAPI 3.0 + Swagger UI

## API Documentation

Interactive API documentation is available through Swagger UI:

```
http://localhost:3000/docs
```

The OpenAPI specification can also be found at:

```
docs/openapi.yaml
```

## API Overview

### Authentication — `/api/user`

| Method | Endpoint                | Description                                   |
| ------ | ----------------------- | --------------------------------------------- |
| POST   | `/user/register`        | Begin registration and send verification code |
| POST   | `/user/register/verify` | Verify email and create account               |
| POST   | `/user/login`           | Login and issue authentication cookies        |
| POST   | `/user/logout`          | Revoke current refresh token                  |
| POST   | `/user/logout/all`      | Revoke all active sessions                    |
| POST   | `/user/token/rotate`    | Rotate refresh/access tokens                  |

### Games — `/api/games` 

Requires a valid `accessToken` cookie.

| Method | Endpoint               | Description                                |
| ------ | ---------------------- | ------------------------------------------ |
| GET    | `/games`               | Retrieve authenticated user's game history |
| POST   | `/games`               | Start a new game                           |
| GET    | `/games/:gameID`       | Retrieve a specific game                   |
| POST   | `/games/:gameID/guess` | Submit a word guess                        |
| POST   | `/games/:gameID/skip`  | Abandon current game and start another     |
| DELETE | `/games/:gameID`       | Delete a game                              |

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/Vyombudha/wordle-backend.git
cd wordle-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

```env
DATABASE_URL="your-database-connection-string"
NODE_ENV="development"

ACCESS_TOKEN_SECRET="your-access-token-secret"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"

SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-email"
SMTP_PASS="your-email-password"
```

### 4. Create Prisma Client

```bash
npm prisma generate
```

### 5. Run database migrations

```bash
npx prisma migrate dev
```

### 6. Start development server

```bash
npm run dev
```

## Testing

Run the integration test suite:

```bash
npm test
```

The test suite covers:

* Registration and email verification flow
* Login/logout lifecycle
* JWT validation
* Refresh token rotation
* Protected routes
* Game lifecycle
* Authorization failures
* IDOR prevention

## Project Goals

This project was built to explore:

* Designing REST APIs with Express.js
* Implementing authentication systems from scratch
* Working with Prisma and PostgreSQL
* Writing production-style middleware
* Testing backend behavior through real HTTP flows
* Designing secure API contracts
