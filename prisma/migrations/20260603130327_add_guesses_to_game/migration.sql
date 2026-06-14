-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "remainingGuesses" INTEGER NOT NULL DEFAULT 6,
    "guesses" TEXT[],
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "targetWord" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
