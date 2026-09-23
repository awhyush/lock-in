-- AlterTable
ALTER TABLE "CircleMember" ADD COLUMN     "visibleKeys" TEXT;

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "target" INTEGER,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'checkbox';

-- AlterTable
ALTER TABLE "GoalEntry" ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 0;
