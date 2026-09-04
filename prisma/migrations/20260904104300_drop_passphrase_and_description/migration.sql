-- 合言葉とひとことをやめる。
--
-- 合言葉は URL の「追加の鍵」ではなく、同じ強さの二本目の鍵だった。
-- どちらか一方が漏れれば入られるので、減らしたほうが出回る秘密が少ない。
-- 以後、グループに入る鍵は招待 URL 一本きり。
DROP INDEX IF EXISTS "Place_passphrase_key";
ALTER TABLE "Place" DROP COLUMN IF EXISTS "passphrase";
ALTER TABLE "Place" DROP COLUMN IF EXISTS "description";
