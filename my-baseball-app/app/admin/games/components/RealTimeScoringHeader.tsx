"use client";

export default function RealTimeScoringHeader({
  inning,
  isTop,
  topPoints,
  bottomPoints,
  inningScore,
  setInningScore,
}: {
  inning: number;
  isTop: boolean;
  topPoints: number[] | null;
  bottomPoints: number[] | null;
  inningScore: number;
  setInningScore: (inningScore: number) => void;
}) {
  return (
    <header className="bg-slate-100 p-4 sticky top-0 z-40 border-b-2 border-slate-300 shadow-sm">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <div className="flex flex-col">
          <span className="text-xl font-black italic leading-none text-blue-700">
            {inning}回{isTop ? "表" : "裏"}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="font-black text-slate-800 mb-1">イニング得点</span>
          <div className="flex items-center gap-3 bg-white px-4 py-1 rounded-full border-2 border-slate-700">
            <button
              onClick={() => setInningScore(Math.max(0, inningScore - 1))}
              className="text-slate-400 font-black w-6 text-xl cursor-pointer"
            >
              -
            </button>
            <span className="text-2xl font-black italic text-slate-900 w-4 text-center">
              {inningScore}
            </span>
            <button
              onClick={() => setInningScore(inningScore + 1)}
              className="text-slate-400 font-black w-6 text-xl cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <div className="text-center">
          <span className="text-2xl font-black italic tracking-widest text-slate-900">
            {isTop
              ? (topPoints?.slice(0, -1).reduce((a, b) => a + b, 0) || 0) +
                (inningScore || 0)
              : topPoints?.reduce((a, b) => a + b, 0) || 0}{" "}
            -{" "}
            {!isTop
              ? (bottomPoints?.slice(0, -1).reduce((a, b) => a + b, 0) || 0) +
                (inningScore || 0)
              : bottomPoints?.reduce((a, b) => a + b, 0) || 0}
          </span>
        </div>
      </div>
    </header>
  );
}
