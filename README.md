# Wordle Backend 

A lightweight, scalable backend service for a Wordle clone game. 

##  Current Status & Features
- **Core Game Loop:** Handles word validation, daily word generation (In Progress), and game state tracking.
- **Database:** Structured with **Prisma ORM** for clean data mapping and type safety.
- **Authentication (In Progress):** Currently features a custom email/password system, moving to OAuth (Google/Discord) next for smoother user onboarding.

##  Tech Stack
- **Runtime:** Node.js / JS
- **Database Wrapper:** Prisma ORM
- **Database:** PostgreSQL 

##  Branch Information
This repository is currently on the `oauth-refactor` branch. 
- `main`: Holds the stable, working base game with local email auth that has been disabled for now due to domain issues.
- `oauth-refactor`: Current workspace for dropping custom email delivery and integrating third-party OAuth providers.

##  Setup & Installation

1. **Clone the project:**
```bash
   git clone [https://github.com/Vyombudha/wordle-backend.git]
   cd wordle-backend
```

2. **Install Dependencies:**
```bash
    npm install

```
3. **Set up environment variables:**
Create a .env file in the root directory and add your database URL:
```bash
    DATABASE_URL="your-database-connection-string"
```

4. **Run Database Migrations:**
```bash
   npx prisma migrate dev
```

5. **Start Dev Server:**
```bash
   npm run dev
```