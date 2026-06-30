-- AddColumn: discount percentage on bookings (admin-only feature)
-- Stores an integer 0–100 representing the percentage discount applied at booking time.
ALTER TABLE "bookings" ADD COLUMN "discount" INTEGER NOT NULL DEFAULT 0;
