// 手ざわりを確かめるための種データ。`npm run seed` で入れ直せる。
//
// 一冊のノートが、はなこ → たろう → はなこ と回ったところ。
// いまノートは、はなこの手元にある。
// たろうが書いた頁は、はなこにとって「新しく回ってきた分」なので、栞が挟まる。
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HOUR = 60 * 60 * 1000;
const now = Date.now();
const at = (hoursAgo) => new Date(now - hoursAgo * HOUR);

async function main() {
  await prisma.page.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.notebook.deleteMany();
  await prisma.user.deleteMany();

  const hanako = await prisma.user.create({
    data: { email: "hanako@example.com", name: "はなこ", emailVerified: at(90) },
  });
  const taro = await prisma.user.create({
    data: { email: "taro@example.com", name: "たろう", emailVerified: at(90) },
  });

  // はなこが手放した時刻と、たろうが手放した時刻
  const hanakoHandedOver = at(50);
  const taroHandedOver = at(8);

  const notebook = await prisma.notebook.create({
    data: {
      name: "ふたりのノート",
      description: "とくに用のない日のことを、置いておく一冊。",
      slug: "futari",
      inviteCode: "kmp4-t7xz",
      createdAt: at(80),
      // 一巡して、いまは はなこ の手元
      holderId: hanako.id,
      memberships: {
        create: [
          {
            userId: hanako.id,
            role: "owner",
            order: 0,
            joinedAt: at(80),
            heldUntil: hanakoHandedOver,
          },
          {
            userId: taro.id,
            role: "member",
            order: 1,
            joinedAt: at(78),
            heldUntil: taroHandedOver,
          },
        ],
      },
    },
  });

  const pages = [
    {
      author: hanako,
      createdAt: at(76),
      sealedAt: hanakoHandedOver,
      body: `窓をすこし開けたら、雨のはじまりの匂いがした。\nアスファルトが濡れる、あの少し埃っぽい匂い。

こういうものを書きとめておく場所がほしかった。
日記というほど整っていなくてもいい。書き散らして、そのままにしておける紙が。

明日も降るらしい。`,
    },
    {
      author: hanako,
      createdAt: at(54),
      sealedAt: hanakoHandedOver,
      body: `豆を切らしていたので、三日ぶんまとめて挽いた。

台所じゅうに匂いが立って、それだけで一日が始まった気がする。
朝にきちんと始まりがあるのは、思っていたよりずっと大事なことだった。

そちらはどうですか。`,
    },
    {
      author: taro,
      createdAt: at(30),
      sealedAt: taroHandedOver,
      body: `駅前の古本屋が閉まっていた。臨時休業の札が、少し傾いたまま貼ってある。

半年ぶりに寄ったのに。
また来ます、と札に向かって言ってしまった。

珈琲の話、こちらは切らしたままです。`,
    },
    {
      // まだ渡していない、はなこの書きかけ。ほかの人にはまだ見えない。
      author: hanako,
      createdAt: at(1),
      sealedAt: null,
      body: `古本屋の話、あの店ならまた開くと思う。

書きかけ。あとで続きを書く。`,
    },
  ];

  for (const page of pages) {
    await prisma.page.create({
      data: {
        notebookId: notebook.id,
        authorId: page.author.id,
        body: page.body,
        sealedAt: page.sealedAt,
        createdAt: page.createdAt,
        updatedAt: page.createdAt,
      },
    });
  }

  console.log(
    [
      "種を蒔きました。",
      "",
      `  ノート「${notebook.name}」は、いま はなこ の手元にあります。`,
      "  たろうが書いた頁が一枚、はなこにとって新しく回ってきた分（栞が挟まります）。",
      "",
      "  /login の「開発用」から、そのまま入れます。",
      "  メールのリンクを通したいときは、この宛先を:",
      "",
      "    hanako@example.com　（はなこ・つくった人・いま持っている）",
      "    taro@example.com　（たろう・仲間）",
      "",
      `  招待コード: ${notebook.inviteCode}`,
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
