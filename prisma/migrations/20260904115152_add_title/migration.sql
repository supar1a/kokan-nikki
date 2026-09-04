-- 題。無くてよい（目次では、無ければ本文の一行目を借りる）。
ALTER TABLE "Slip" ADD COLUMN IF NOT EXISTS "title" TEXT;
