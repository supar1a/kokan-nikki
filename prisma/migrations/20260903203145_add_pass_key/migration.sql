-- 名前だけで始めた人の「戻り口」。
-- 既存の行はすべて NULL になる。PostgreSQL の一意制約は NULL を重複と見なさないので、
-- 何行あっても衝突しない。
ALTER TABLE "User" ADD COLUMN "passKey" TEXT;

CREATE UNIQUE INDEX "User_passKey_key" ON "User"("passKey");
