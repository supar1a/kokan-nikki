-- 「交換日記」から「短冊」へ。
--
-- すでに動いている本番には、交換日記のころの表が残っている。
-- 中身の表（ノートと頁）は考え方ごと変わったので落とすが、
-- 名乗り（User / Account / Session / VerificationToken）はそのまま残す。
-- ログイン済みの人と、その戻り口 URL を壊さないため。
--
-- まだ何も無い環境でも同じ SQL が通るよう、すべて存在チェック付きで書いてある。

-- ▼ 交換日記のころの中身を落とす
DROP TABLE IF EXISTS "Page" CASCADE;
DROP TABLE IF EXISTS "Entry" CASCADE;
DROP TABLE IF EXISTS "Membership" CASCADE;
DROP TABLE IF EXISTS "Notebook" CASCADE;
DROP TABLE IF EXISTS "Group" CASCADE;
DROP TABLE IF EXISTS "Slip" CASCADE;
DROP TABLE IF EXISTS "Place" CASCADE;

-- ▼ 名乗り（すでにあれば触らない）
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- ▼ 短冊の中身
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "passphrase" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "lastReadAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Slip" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slip_pkey" PRIMARY KEY ("id")
);

-- ▼ 索引
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_passKey_key" ON "User"("passKey");
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

CREATE UNIQUE INDEX "Place_slug_key" ON "Place"("slug");
CREATE UNIQUE INDEX "Place_passphrase_key" ON "Place"("passphrase");
CREATE INDEX "Membership_placeId_idx" ON "Membership"("placeId");
CREATE UNIQUE INDEX "Membership_userId_placeId_key" ON "Membership"("userId", "placeId");
CREATE INDEX "Slip_placeId_createdAt_idx" ON "Slip"("placeId", "createdAt");
CREATE INDEX "Slip_authorId_idx" ON "Slip"("authorId");

-- ▼ 外部キー（名乗りの側は、すでにあれば黙って通す）
DO $$ BEGIN
    ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Slip" ADD CONSTRAINT "Slip_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Slip" ADD CONSTRAINT "Slip_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
