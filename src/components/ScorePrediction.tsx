import { User, RubricAspect, BehaviorReport } from '../types';
import { getGrade, scoreBreakdown, scoreTone, SCORE_MAX } from '../utils';

// Label aspek di riwayat penilaian. label null = laporan tanpa aspek.
export function AspectBadge({ label }: { label: string | null }) {
  if (!label) return <span className="text-[9px] font-bold text-neutral-400">Tanpa aspek</span>;
  const deleted = label === 'Aspek sudah dihapus';
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border ${deleted ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
      {label}
    </span>
  );
}

const TONE_CLASS = {
  good: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  mid: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-red-100 text-red-700 border-red-200',
};

// Badge nilai berwarna: hijau ≥80, kuning 60–79, merah <60 (lihat scoreTone)
export function ScoreBadge({ score, size = 'sm', grade = true }: { score: number; size?: 'sm' | 'lg'; grade?: boolean }) {
  return (
    <span className={`inline-flex items-baseline gap-1 rounded-lg border font-black ${TONE_CLASS[scoreTone(score)]} ${size === 'lg' ? 'px-3 py-1 text-3xl' : 'px-2.5 py-0.5 text-sm'}`}>
      {score}
      {grade && <span className="text-[0.6em] opacity-80">({getGrade(score)})</span>}
    </span>
  );
}

// Panduan skala nilai aspek. Rentang huruf mengikuti getGrade di utils.ts.
const SCALE = [
  ['90–100', 'A', 'Sangat baik: konsisten melebihi harapan'],
  ['80–89', 'B', 'Baik: memenuhi harapan, sesekali ada kekurangan'],
  ['70–79', 'C', 'Cukup: memenuhi standar minimum'],
  ['60–69', 'D', 'Kurang: sering belum memenuhi, perlu pembinaan'],
  ['0–59', 'E', 'Sangat kurang: jarang memenuhi standar'],
];

export function ScoreGuide() {
  return (
    <details className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs text-neutral-600">
      <summary className="font-bold text-neutral-700 cursor-pointer">Panduan penilaian</summary>
      <ul className="list-disc pl-4 mt-2 space-y-1">
        <li>Nilai tiap aspek <b>0–100</b>.</li>
        <li>Setiap laporan perilaku langsung menambah/mengurangi nilai aspeknya (maks ±poin per laporan sesuai aspek, atur di Settings). Angka di form ini sudah termasuk poin laporan.</li>
        <li>Nilai aspek di atas 100 dihitung 100, di bawah 0 dihitung 0. Nilai akhir = rata-rata berbobot semua aspek.</li>
        <li>Aspek bertanda "otomatis dari presensi" tidak perlu diisi.</li>
      </ul>
      <table className="w-full mt-3">
        <tbody>
          {SCALE.map(([range, grade, desc]) => (
            <tr key={grade} className="border-t border-neutral-200">
              <td className="py-1 pr-2 font-bold whitespace-nowrap">{range}</td>
              <td className="py-1 pr-2 font-bold text-[#B45309]">{grade}</td>
              <td className="py-1">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

// Prediksi nilai akhir + rinciannya, dipakai modal "Update Nilai Akhir" (HR & dosen)
export function ScorePrediction({ user, rubricValues, rubricAspects, reports }: {
  user: User;
  rubricValues: Record<string, number>;
  rubricAspects: RubricAspect[];
  reports: BehaviorReport[];
}) {
  const b = scoreBreakdown({ ...user, rubricScores: rubricValues }, rubricAspects, reports);
  const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);

  return (
    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mt-6">
      <p className="text-sm font-bold text-indigo-900 mb-1">Prediksi Nilai Akhir</p>
      <ScoreBadge score={b.total} size="lg" />
      <div className="mt-3 pt-3 border-t border-indigo-100 space-y-1 text-xs font-medium text-indigo-800">
        {b.aspects.map(a => (
          <div key={a.id} className="flex justify-between gap-3">
            <span>{rubricAspects.find(r => r.id === a.id)?.name} <span className="opacity-60">({a.weight}%)</span></span>
            <span className="font-bold">{a.value}</span>
          </div>
        ))}
        <div className="flex justify-between pt-1 border-t border-indigo-100"><span>Rata-rata berbobot</span><span className="font-bold">{b.rubricPart}</span></div>
        {b.noAspectPart !== 0 && (
          <div className="flex justify-between text-amber-700">
            <span>Laporan tanpa aspek</span><span className="font-bold">{fmt(b.noAspectPart)}</span>
          </div>
        )}
        {b.rubricPart + b.noAspectPart !== b.total && (
          <p className="text-[11px] text-indigo-600">Total {b.rubricPart + b.noAspectPart} dibatasi menjadi {b.total} (rentang 0–{SCORE_MAX}).</p>
        )}
      </div>
    </div>
  );
}
