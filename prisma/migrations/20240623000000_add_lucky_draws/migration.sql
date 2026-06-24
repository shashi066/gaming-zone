-- CreateTable: lucky_draws
CREATE TABLE "lucky_draws" (
    "id"             TEXT NOT NULL,
    "title"          TEXT NOT NULL,
    "description"    TEXT,
    "prize"          TEXT NOT NULL,
    "status"         TEXT NOT NULL DEFAULT 'DRAFT',
    "startsAt"       TIMESTAMP(3),
    "endsAt"         TIMESTAMP(3),
    "winnerId"       TEXT,
    "winnerPickedAt" TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lucky_draws_pkey" PRIMARY KEY ("id")
);

-- CreateTable: draw_entries
CREATE TABLE "draw_entries" (
    "id"        TEXT NOT NULL,
    "drawId"    TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draw_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique entry per user per draw
CREATE UNIQUE INDEX "draw_entries_drawId_userId_key" ON "draw_entries"("drawId", "userId");

-- AddForeignKey: draw_entries.drawId → lucky_draws.id
ALTER TABLE "draw_entries" ADD CONSTRAINT "draw_entries_drawId_fkey"
    FOREIGN KEY ("drawId") REFERENCES "lucky_draws"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: draw_entries.userId → users.id
ALTER TABLE "draw_entries" ADD CONSTRAINT "draw_entries_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: lucky_draws.winnerId → users.id
ALTER TABLE "lucky_draws" ADD CONSTRAINT "lucky_draws_winnerId_fkey"
    FOREIGN KEY ("winnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
