-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('EASY', 'HARD', 'DAILY');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mode" "GameMode" NOT NULL DEFAULT 'EASY';
