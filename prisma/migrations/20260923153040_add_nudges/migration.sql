-- CreateTable
CREATE TABLE "Nudge" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Nudge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Nudge_toUserId_date_idx" ON "Nudge"("toUserId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Nudge_circleId_fromUserId_toUserId_date_key" ON "Nudge"("circleId", "fromUserId", "toUserId", "date");

-- AddForeignKey
ALTER TABLE "Nudge" ADD CONSTRAINT "Nudge_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nudge" ADD CONSTRAINT "Nudge_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nudge" ADD CONSTRAINT "Nudge_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
