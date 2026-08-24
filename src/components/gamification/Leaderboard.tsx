"use client";

export type LeaderboardRow = {
  rank: number;
  name: string;
  handle: string;
  points: number;
  earnings: number;
};

export function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">El feed no miente</p>
      <h3 className="mt-1 font-display text-xl font-bold text-white">Quién está sonando</h3>
      <ol className="mt-5 space-y-2">
        {rows.map((row) => (
          <li
            key={row.handle}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/35 px-3 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-8 font-display text-sm font-extrabold ${
                  row.rank === 1 ? "text-klik-green" : row.rank === 2 ? "text-klik-cyan" : "text-white/40"
                }`}
              >
                {String(row.rank).padStart(2, "0")}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{row.name}</p>
                <p className="text-[11px] text-white/45">@{row.handle}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-klik-cyan">{row.points.toLocaleString("es-MX")} pts</p>
              <p className="text-[11px] text-klik-green">
                ${row.earnings.toLocaleString("es-MX")}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
