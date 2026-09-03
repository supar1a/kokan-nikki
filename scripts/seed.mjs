// 手ざわりを確かめるための種データ。`npm run seed` で入れ直せる。
//
// 手番も宛先もない。誰かが思い出したときに書いて、誰かがたまに読む、という状態。
// アカウントはないので、人は名前だけを持つ。
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HOUR = 60 * 60 * 1000;
const now = Date.now();
const at = (hoursAgo) => new Date(now - hoursAgo * HOUR);

const PEOPLE = {
  hanako: { name: "はなこ" },
  taro: { name: "たろう" },
  jiro: { name: "じろう" },
};

const SLIPS = [
  {
    who: "hanako",
    at: 76,
    body: `窓をすこし開けたら、雨のはじまりの匂いがした。アスファルトが濡れる、あの少し埃っぽい匂い。

こういうのを書きとめておく場所がほしかった。日記というほど整っていなくていいし、誰かに読ませるつもりもない。ただ、置いておける紙が。`,
  },
  {
    who: "taro",
    at: 61,
    body: `転職の話、まだ誰にも言っていない。言うと本当になりそうで。

いや、本当になってほしいのかもしれない。`,
  },
  {
    who: "jiro",
    at: 49,
    body: `駅前の古本屋が閉まっていた。臨時休業の札が、少し傾いたまま貼ってある。

半年ぶりに寄ったのに。また来ます、と札に向かって言ってしまった。`,
  },
  {
    who: "hanako",
    at: 30,
    body: `豆を切らしていたので、三日ぶんまとめて挽いた。台所じゅうに匂いが立って、それだけで一日が始まった気がする。

朝にきちんと始まりがあるのは、思っていたよりずっと大事なことだった。SNSに書くと丁寧な暮らしみたいになるから書かないけど、本当はもっと切実な話で、そうしないと一日が始まらない。`,
  },
  {
    who: "taro",
    at: 14,
    body: `人と会ったあと、必ず二時間くらい、何も手につかない時間がある。

嫌だったわけじゃない。むしろ楽しかった日のほうが長い。あれは何なんだろう。`,
  },
  {
    who: "jiro",
    at: 5,
    body: `古本屋、今日は開いてた。何も買わずに出た。`,
  },
  {
    // 下書き。書いた本人にしか見えない。
    who: "hanako",
    at: 1,
    draft: true,
    body: `まだ途中。

夜中に思いついたことを、そのまま置いてある。`,
  },
];

async function main() {
  await prisma.slip.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.session.deleteMany();
  await prisma.place.deleteMany();
  await prisma.user.deleteMany();

  const users = {};
  for (const [key, person] of Object.entries(PEOPLE)) {
    users[key] = await prisma.user.create({ data: person });
  }

  const place = await prisma.place.create({
    data: {
      name: "三人のところ",
      description: "とくに用のない日のことを、置いておく。",
      slug: "sannin",
      passphrase: "ゆうやけ",
      createdAt: at(200),
      memberships: {
        create: [
          // はなこは、たろうの最新の一枚より前に見たきり。だから未読の目印が出る。
          { userId: users.hanako.id, role: "owner", joinedAt: at(200), lastReadAt: at(20) },
          { userId: users.taro.id, joinedAt: at(198), lastReadAt: at(4) },
          { userId: users.jiro.id, joinedAt: at(150), lastReadAt: at(48) },
        ],
      },
    },
  });

  for (const slip of SLIPS) {
    await prisma.slip.create({
      data: {
        placeId: place.id,
        authorId: users[slip.who].id,
        body: slip.body,
        published: !slip.draft,
        createdAt: at(slip.at),
        updatedAt: at(slip.at),
      },
    });
  }

  console.log(
    [
      "種を蒔きました。",
      "",
      `  グループ「${place.name}」　合言葉: ${place.passphrase}`,
      "",
      "  入口の「開発用」から、その人として見られます。",
      "  はなこで見ると、前に見たあとに書かれた分に目印が出ます。",
      "",
      `  招待 URL: http://localhost:3000/b/${place.slug}`,
      "",
    ].join("\n"),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
