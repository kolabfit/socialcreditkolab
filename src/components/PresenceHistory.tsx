import { CalendarCheck } from 'lucide-react';
import { PresenceSync } from '../types';
import { ScoreBadge } from './ScorePrediction';

// Samakan dengan PRESENCE_WEIGHTS di server/routes/integration.js
const PARTS = [
  { key: 'kehadiran', label: 'Kehadiran', weight: 40, hint: 'tepat waktu + ½ telat dibanding hari wajib hadir' },
  { key: 'konsistensi', label: 'Konsistensi laporan', weight: 30, hint: 'hari hadir yang ada laporan hariannya' },
  { key: 'kualitas', label: 'Kualitas laporan', weight: 30, hint: 'laporan disetujui dibanding yang sudah dinilai admin' },
] as const;

const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

// Rincian & riwayat nilai aspek yang diisi otomatis dari aplikasi presensi
export function PresenceHistory({ history }: { history?: PresenceSync[] | null }) {
  if (!Array.isArray(history) || history.length === 0) {
    return (
      <div className="p-4 rounded-2xl border border-dashed border-neutral-200 text-sm text-neutral-500 flex items-center gap-2">
        <CalendarCheck className="w-4 h-4" /> Belum ada penilaian otomatis dari presensi.
      </div>
    );
  }
  const [latest] = history;
  const counts = [
    ['Tepat waktu', latest.ontime],
    ['Telat', `${latest.late}× (${latest.total_late_minutes} mnt)`],
    ['Alpha', latest.alpha],
    ['Izin / sakit', latest.izin_sakit],
    ['Tanpa laporan', latest.missing_daily_reports],
    ['Laporan', `${latest.reports.approved} ✓ · ${latest.reports.disapproved} ✗ · ${latest.reports.pending} pending`],
  ];

  return (
    <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 space-y-4">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h4 className="font-bold text-neutral-800 flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-emerald-600" /> Penilaian Otomatis Presensi</h4>
          <p className="text-xs text-neutral-500 mt-1">Periode {fmt(latest.period_start)} – {fmt(latest.period_end)} · sync {fmt(latest.synced_at)}</p>
        </div>
        <ScoreBadge score={latest.score} size="lg" grade={false} />
      </div>

      <div className="space-y-2">
        {PARTS.map(p => {
          const v = latest.parts[p.key];
          return (
            <div key={p.key} title={p.hint}>
              <div className="flex justify-between text-xs font-semibold text-neutral-600 mb-1">
                <span>{p.label} <span className="text-neutral-400">({p.weight}%)</span></span>
                <span>{v == null ? 'belum ada yang dinilai' : v}</span>
              </div>
              <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-neutral-100">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${v ?? 0}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {counts.map(([label, value]) => (
          <div key={label} className="bg-white rounded-xl p-2 border border-neutral-100">
            <dt className="text-neutral-500">{label}</dt>
            <dd className="font-bold text-neutral-800">{value}</dd>
          </div>
        ))}
      </dl>

      {history.length > 1 && (
        <div>
          <p className="text-xs font-bold text-neutral-600 mb-2">Riwayat sync</p>
          <ul className="space-y-1 text-xs">
            {history.map((h, i) => {
              const prev = history[i + 1];
              const diff = prev ? h.score - prev.score : 0;
              return (
                <li key={h.synced_at} className="flex justify-between bg-white rounded-lg px-3 py-2 border border-neutral-100">
                  <span className="text-neutral-600">{fmt(h.synced_at)} <span className="text-neutral-400">· {fmt(h.period_start)} – {fmt(h.period_end)}</span></span>
                  <span className="font-bold text-neutral-800">
                    <ScoreBadge score={h.score} grade={false} />
                    {diff !== 0 && <span className={diff > 0 ? 'text-emerald-600 ml-1' : 'text-red-500 ml-1'}>{diff > 0 ? `+${diff}` : diff}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
