-- アカウントをやめて、名前とクッキーだけにする。
--
-- すでに動いている本番には、Auth.js のころの表が残っている。
-- グループと短冊は残す。名乗りの仕組みだけを入れ替える。
--
-- Session は形が変わるので作り直す。つまり全員がいったん「誰でもない」状態に戻るが、
-- グループの URL をひらいて自分の名前を選べば戻れる。それが今回の設計そのもの。
--
-- まっさらな環境でも同じ SQL が通るよう、存在チェック付きで書いてある。

-- ▼ 使わなくなった表
DROP TABLE IF EXISTS "Account" CASCADE;
DROP TABLE IF EXISTS "VerificationToken" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;

-- ▼ 名乗り。名前のほかに持つものがない。
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- 名前を決めないまま止まっていた人は、書いたものも持っていないので落とす
DELETE FROM "User" WHERE "name" IS NULL;

ALTER TABLE "User" DROP COLUMN IF EXISTS "email";
ALTER TABLE "User" DROP COLUMN IF EXISTS "emailVerified";
ALTER TABLE "User" DROP COLUMN IF EXISTS "image";
ALTER TABLE "User" DROP COLUMN IF EXISTS "passKey";
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;

CREATE TABLE "Session" (
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("token")
);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ▼ グループと短冊（すでにあれば、そのまま）
CREATE TABLE IF NOT EXISTS "Place" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "passphrase" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "lastReadAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Slip" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slip_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Place_slug_key" ON "Place"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Place_passphrase_key" ON "Place"("passphrase");
CREATE INDEX IF NOT EXISTS "Membership_placeId_idx" ON "Membership"("placeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Membership_userId_placeId_key" ON "Membership"("userId", "placeId");
CREATE INDEX IF NOT EXISTS "Slip_placeId_createdAt_idx" ON "Slip"("placeId", "createdAt");
CREATE INDEX IF NOT EXISTS "Slip_authorId_idx" ON "Slip"("authorId");

DO $$ BEGIN
    ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "Membership" ADD CONSTRAINT "Membership_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "Slip" ADD CONSTRAINT "Slip_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "Slip" ADD CONSTRAINT "Slip_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
