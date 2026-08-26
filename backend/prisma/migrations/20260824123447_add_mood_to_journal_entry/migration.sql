-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD');

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "mood" "Mood";
