const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'FieldDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

const tableStart = `<div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-100">
                    <tr>
                      <th className="p-4 w-10">`;

const tableEnd = `</table>
              </div>
              <Pagination {...paginationReports} />`;

const tIndex = content.indexOf(tableStart);
const tEndIndex = content.indexOf(tableEnd, tIndex) + tableEnd.length;

if (tIndex !== -1 && tEndIndex > tIndex) {
  const dataTable = `<DataTable
                title="Riwayat Penilaian (Laporan)"
                data={reports}
                emptyMessage="Belum ada riwayat laporan."
                columns={[
                  {
                    key: 'checkbox',
                    label: <input type="checkbox" onChange={(e) => setSelectedReportIds(e.target.checked ? reports.map(r => r.id) : [])} checked={selectedReportIds.length === reports.length && reports.length > 0} className="rounded text-[#EAB308] focus:ring-[#EAB308] w-4 h-4" />,
                    filterable: false,
                    render: (report) => <input type="checkbox" checked={selectedReportIds.includes(report.id)} onChange={(e) => {
                      if (e.target.checked) setSelectedReportIds([...selectedReportIds, report.id]);
                      else setSelectedReportIds(selectedReportIds.filter(id => id !== report.id));
                    }} className="rounded text-[#EAB308] focus:ring-[#EAB308] w-4 h-4" />
                  },
                  {
                    key: 'reporter',
                    label: 'Pelapor & Waktu',
                    filterable: true,
                    render: (report) => {
                      const reporter = users.find(u => u.id === report.reporterId);
                      return (
                        <div>
                          <p className="font-bold text-neutral-800 text-sm">{reporter?.name || 'Unknown'}</p>
                          <p className="text-xs font-medium text-neutral-500 mt-1">{new Date(report.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short'})}</p>
                        </div>
                      )
                    }
                  },
                  {
                    key: 'target',
                    label: 'Target Evaluasi',
                    filterable: true,
                    render: (report) => {
                      const targetUser = users.find(u => u.id === report.targetId);
                      const targetName = report.targetType === 'startup' ? report.targetId : (targetUser?.name || 'Unknown');
                      return (
                        <div>
                           <p className="font-bold text-neutral-800">{targetName}</p>
                           <div className="mt-1">
                             {report.targetType === 'startup' ? (
                               <span className="inline-flex text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Startup Team</span>
                             ) : (
                               <span className="inline-flex text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Intern / Individu</span>
                             )}
                           </div>
                           {targetUser?.startup && report.targetType !== 'startup' && <p className="text-xs text-neutral-500 mt-1">Tim: {targetUser.startup}</p>}
                        </div>
                      )
                    }
                  },
                  {
                    key: 'pointsImpact',
                    label: 'Kredit Score',
                    filterable: true,
                    render: (report) => (
                      <div className="flex flex-col gap-1 items-start">
                        <span className={\`inline-flex px-3 py-1.5 rounded-lg text-sm font-bold \${report.pointsImpact > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                          {report.pointsImpact > 0 ? \`+\${report.pointsImpact}\` : report.pointsImpact} Poin
                        </span>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{report.type === 'good' ? 'Tindakan Baik' : 'Pelanggaran'}</span>
                      </div>
                    )
                  },
                  {
                    key: 'description',
                    label: 'Keterangan',
                    filterable: true,
                    render: (report) => (
                      <div className="bg-white border border-neutral-100 p-3 rounded-xl shadow-sm max-w-sm">
                        <p className="text-neutral-700 text-xs font-medium leading-relaxed">{report.description}</p>
                      </div>
                    )
                  },
                  {
                    key: 'lampiran',
                    label: 'Lampiran',
                    filterable: false,
                    render: (report) => (
                      report.photoUrl ? (
                        <button onClick={() => setViewedPhotoUrl(report.photoUrl)} className="block w-16 h-16 rounded-xl overflow-hidden shadow-sm border border-neutral-200 hover:ring-2 hover:ring-[#EAB308] transition-all">
                          <img src={report.photoUrl} alt="Bukti" className="w-full h-full object-cover" />
                        </button>
                      ) : '-'
                    )
                  },
                  {
                    key: 'action',
                    label: 'Aksi',
                    filterable: false,
                    render: (report) => (
                      <button onClick={() => {
                        import('sweetalert2').then(Swal => {
                          Swal.default.fire({
                            title: 'Hapus Laporan?',
                            text: "Aksi ini tidak dapat dibatalkan dan skor akan dikembalikan.",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#ef4444',
                            cancelButtonColor: '#d1d5db',
                            confirmButtonText: 'Ya, hapus!',
                            cancelButtonText: 'Batal'
                          }).then((result) => {
                            if (result.isConfirmed) {
                              deleteReport(report.id);
                              Swal.default.fire('Terhapus!', 'Laporan telah dihapus.', 'success');
                            }
                          });
                        });
                      }} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-neutral-400 hover:text-red-500" title="Hapus Laporan">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )
                  }
                ]}
              />`;

  content = content.substring(0, tIndex) + dataTable + content.substring(tEndIndex);
  console.log("Replaced reports table.");
} else {
  console.log("Could not find reports table bounds");
}

fs.writeFileSync(file, content);
console.log("Done");
