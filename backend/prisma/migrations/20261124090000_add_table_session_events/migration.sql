-- CreateTable
CREATE TABLE "TableSessionEvent" (
    "id" TEXT NOT NULL,
    "tableSessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "actorName" TEXT,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TableSessionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TableSessionEvent_tableSessionId_createdAt_idx" ON "TableSessionEvent"("tableSessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "TableSessionEvent" ADD CONSTRAINT "TableSessionEvent_tableSessionId_fkey" FOREIGN KEY ("tableSessionId") REFERENCES "TableSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
