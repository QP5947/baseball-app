import Link from "next/link";

export default function page() {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <CTA />
    </>
  );
}

export function Header() {
  return (
    <header className="fixed top-0 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-50">
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="text-xl font-bold text-white tracking-tighter">
          DashBase
        </div>
        <div className="flex items-center gap-6">
          <a href="/admin/login" className="text-slate-300 hover:text-white">
            管理者ログイン
          </a>

          <a href="/player/login" className="text-slate-300 hover:text-white">
            選手ログイン
          </a>
          <a
            href="/register-entry"
            className="bg-sky-500 hover:bg-sky-400 text-white px-5 py-2 rounded-lg font-bold"
          >
            無料で始める
          </a>
        </div>
      </nav>
    </header>
  );
}

export function Hero() {
  return (
    <>
      <section className="bg-slate-900 text-white pt-70 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          {/* 左側：テキストコンテンツ */}
          <div className="flex-1 space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              その一打を、
              <br />
              <span className="text-sky-400">チームの誇りに変える。</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300">
              スコアブックを閉じた瞬間、全選手のスタッツが輝きだす。
              <br />
              あなたの入力が、チーム全員のモチベーションになる。
            </p>
            <div className="pt-4">
              <Link
                href="/register-entry"
                className="inline-block bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105"
              >
                無料でチームを作成する
              </Link>
            </div>
          </div>

          {/* 右側：グラフ画像（仮置き） */}
          <div className="flex-1 w-full max-w-lg">
            <div className="bg-slate-800 p-4 rounded-2xl shadow-2xl border border-slate-700">
              {/* 実際のグラフ画像やコンポーネントをここに配置 */}
              <div className="aspect-4/3 bg-linear-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center text-slate-500">
                <img
                  src="/lp-top.png"
                  alt="Sample Graph"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

const features = [
  {
    title: "秒速入力・自動集計",
    desc: "スコアシートの転記は不要。スマホでポチッと入力すれば、成績・指標は瞬時に最新化。",
    icon: "⚡",
  },
  {
    title: "プロ級の分析グラフ",
    desc: "打率の推移や球場別成績を自動でグラフ化。自分の成長を視覚的に楽しもう。",
    icon: "📊",
  },
  {
    title: "チームでリアルタイム共有",
    desc: "入力したデータはメンバー全員と同期。試合後の飲み会が、データ分析でさらに盛り上がる。",
    icon: "🤝",
  },
];

export function Features() {
  return (
    <section className="py-24 bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          草野球の「当たり前」を、
          <span className="text-sky-400">アップデート</span>する。
        </h2>

        <div className="grid md:grid-cols-3 gap-12">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-sky-500 transition-colors"
            >
              <div className="text-4xl mb-6">{f.icon}</div>
              <h3 className="text-xl font-bold mb-4">{f.title}</h3>
              <p className="text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="py-24 px-6 bg-linear-to-b from-slate-900 to-slate-950 text-center">
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white">
          チームの未来を、
          <br />
          <span className="text-sky-400">今日から変えてみませんか？</span>
        </h2>
        <p className="text-lg text-slate-400">
          今すぐチームを作成して、スタッツ管理の楽しさを体感してください。
          <br />
          あなたのフィードバックが、DashBaseを世界一のツールに育てます。
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register-entry"
            className="bg-sky-500 hover:bg-sky-400 text-white text-lg font-bold py-4 px-10 rounded-xl transition-all shadow-lg shadow-sky-500/20"
          >
            無料でチームを始める
          </Link>
        </div>
      </div>
    </section>
  );
}
