const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'FieldDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Batches table
const batchesStart = `<div className="overflow-x-auto flex-1">
                      <table className="w-full text-left text-sm whitespace-nowrap">`;
const batchesEnd = `</table>
                    </div>`;

const bIndex = content.indexOf(batchesStart);
const bEndIndex = content.indexOf(batchesEnd, bIndex) + batchesEnd.length;

if (bIndex !== -1 && bEndIndex > bIndex) {
  const dataTableBatches = `<DataTable
                      title=""
                      data={batches}
                      emptyMessage="Belum ada data batch."
                      columns={[
                        {
                          key: 'name',
                          label: 'Nama Batch',
                          filterable: true,
                          render: (batch) => <span className="font-bold text-neutral-800">{batch.name}</span>
                        },
                        {
                          key: 'date_range',
                          label: 'Rentang Tanggal',
                          filterable: true,
                          render: (batch) => <span className="text-neutral-600 text-xs font-medium">{batch.date_range}</span>
                        },
                        {
                          key: 'status',
                          label: 'Status',
                          filterable: true,
                          render: (batch) => batch.status === 'active' ? (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider">Aktif</span>
                          ) : (
                            <span className="bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider">Selesai</span>
                          )
                        },
                        {
                          key: 'action',
                          label: 'Aksi',
                          filterable: false,
                          render: (batch) => (
                            <div className="flex items-center gap-2">
                              <button onClick={() => {
                                setEditingBatch(batch);
                                setBatchFormData({ name: batch.name, date_range: batch.date_range, status: batch.status });
                                setShowBatchModal(true);
                              }} className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteBatch(batch.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )
                        }
                      ]}
                    />`;
  content = content.substring(0, bIndex) + dataTableBatches + content.substring(bEndIndex);
  console.log("Replaced batches table.");
}

// 2. Startups table
const startupsStart = `<div className="overflow-hidden border border-neutral-100 rounded-2xl">
                    <table className="w-full text-left text-sm">`;
const startupsEnd = `</table>
                  </div>
                  <Pagination {...paginationStartups} />`;

const sIndex = content.indexOf(startupsStart);
const sEndIndex = content.indexOf(startupsEnd, sIndex) + startupsEnd.length;

if (sIndex !== -1 && sEndIndex > sIndex) {
  const dataTableStartups = `<DataTable
                    title=""
                    data={startups}
                    emptyMessage="Belum ada data startup."
                    columns={[
                      {
                        key: 'name',
                        label: 'Nama Startup',
                        filterable: true,
                        render: (startup) => editingStartupId === startup.id ? (
                          <input type="text" value={editStartupName} onChange={e => setEditStartupName(e.target.value)} className="w-full border border-neutral-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none" />
                        ) : <span className="font-bold text-neutral-800">{startup.name}</span>
                      },
                      {
                        key: 'description',
                        label: 'Deskripsi',
                        filterable: true,
                        render: (startup) => editingStartupId === startup.id ? (
                          <input type="text" value={editStartupDesc} onChange={e => setEditStartupDesc(e.target.value)} className="w-full border border-neutral-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none" />
                        ) : <span className="text-neutral-500 truncate max-w-xs block">{startup.description}</span>
                      },
                      {
                        key: 'action',
                        label: 'Aksi',
                        filterable: false,
                        render: (startup) => (
                          <div className="flex items-center justify-center gap-2">
                            {editingStartupId === startup.id ? (
                              <>
                                <button onClick={() => {
                                  updateStartup(startup.id, { name: editStartupName, description: editStartupDesc });
                                  setEditingStartupId(null);
                                  import('sweetalert2').then(Swal => Swal.default.fire('Berhasil', 'Startup diperbarui', 'success'));
                                }} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg"><Save className="w-4 h-4"/></button>
                                <button onClick={() => setEditingStartupId(null)} className="p-2 bg-neutral-100 text-neutral-500 hover:bg-neutral-200 rounded-lg"><X className="w-4 h-4"/></button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={() => {
                                    setEditingStartupId(startup.id);
                                    setEditStartupName(startup.name);
                                    setEditStartupDesc(startup.description);
                                  }}
                                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    import('sweetalert2').then(Swal => {
                                      Swal.default.fire({
                                        title: 'Hapus Startup?',
                                        text: 'Tindakan ini tidak dapat dibatalkan.',
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonText: 'Ya, Hapus',
                                        cancelButtonText: 'Batal'
                                      }).then((result) => {
                                        if (result.isConfirmed) {
                                          deleteStartup(startup.id);
                                          Swal.default.fire('Terhapus!', 'Startup berhasil dihapus.', 'success');
                                        }
                                      });
                                    });
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        )
                      }
                    ]}
                  />`;
  content = content.substring(0, sIndex) + dataTableStartups + content.substring(sEndIndex);
  console.log("Replaced startups table.");
} else {
  console.log("Could not find startups table bounds");
}

fs.writeFileSync(file, content);
console.log("Done");
