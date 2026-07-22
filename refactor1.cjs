const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'FieldDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add import for DataTable
if (!content.includes("import { DataTable }")) {
  content = content.replace("import { Pagination } from './Pagination';", "import { Pagination } from './Pagination';\nimport { DataTable } from './DataTable';");
}

const usersTableStart = `<div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">`;
const usersTableEnd = `</table>
              </div>
              <Pagination {...paginationUsers} />`;

const usersTableIndex = content.indexOf(usersTableStart);
const usersTableEndIndex = content.indexOf(usersTableEnd, usersTableIndex) + usersTableEnd.length;

if (usersTableIndex !== -1 && usersTableEndIndex > usersTableIndex) {
  const dataTableUsers = `<DataTable
                title={userTab === 'intern' ? 'Data Peserta Magang' : 'Data Dosen Pembimbing'}
                data={activeUsersList}
                emptyMessage="Tidak ada data pengguna."
                columns={[
                  {
                    key: 'checkbox',
                    label: <input type="checkbox" onChange={(e) => setSelectedUserIds(e.target.checked ? activeUsersList.map(u => u.id) : [])} checked={selectedUserIds.length === activeUsersList.length && activeUsersList.length > 0} className="rounded text-[#EAB308] focus:ring-[#EAB308] w-4 h-4" />,
                    filterable: false,
                    render: (user) => <input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={(e) => {
                      if (e.target.checked) setSelectedUserIds([...selectedUserIds, user.id]);
                      else setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                    }} className="rounded text-[#EAB308] focus:ring-[#EAB308] w-4 h-4" />
                  },
                  {
                    key: 'info',
                    label: 'Info Utama',
                    filterable: true,
                    render: (user) => (
                      <div>
                        <p className="font-bold text-neutral-800">{user.name}</p>
                        {userTab === 'intern' && <p className="text-xs text-neutral-500 mt-0.5">Panggilan: {user.nickname || '-'}</p>}
                      </div>
                    )
                  },
                  {
                    key: 'contact',
                    label: 'Kontak',
                    filterable: true,
                    render: (user) => (
                      <div>
                        <p className="text-sm font-medium text-neutral-700">{user.email}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{user.phone || 'No telp -'}</p>
                      </div>
                    )
                  },
                  ...(userTab === 'intern' ? [
                    {
                      key: 'academic',
                      label: 'Akademik & Startup',
                      filterable: true,
                      render: (user) => (
                        <div>
                          <p className="font-medium text-neutral-700">{user.startup || '-'}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">NIM: {user.nim || '-'}</p>
                        </div>
                      )
                    },
                    {
                      key: 'performance',
                      label: 'Performa',
                      filterable: true,
                      render: (user) => (
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-1 font-bold text-[#EAB308]"><Star className="w-4 h-4 fill-[#EAB308]"/> {user.score} (Nilai {getGrade(user.score)})</div>
                        </div>
                      )
                    }
                  ] : []),
                  ...(userTab === 'academic' ? [
                    {
                      key: 'advisedStartups',
                      label: 'Startup Bimbingan',
                      filterable: true,
                      render: (user) => (
                        <div>
                          <p className="font-medium text-neutral-700">{user.advisedStartups ? user.advisedStartups.join(', ') : '-'}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">Kode: {user.lecturerCode || '-'}</p>
                        </div>
                      )
                    }
                  ] : []),
                  {
                    key: 'status',
                    label: 'Status',
                    filterable: true,
                    render: (user) => user.status === 'suspended' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700">
                        <Ban className="w-3 h-3" /> Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700">
                        <ShieldCheck className="w-3 h-3" /> Active
                      </span>
                    )
                  },
                  {
                    key: 'action',
                    label: 'Aksi',
                    filterable: false,
                    render: (user) => (
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionMenuId(openActionMenuId === user.id ? null : user.id);
                          }}
                          className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        <AnimatePresence>
                          {openActionMenuId === user.id && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-8 top-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-neutral-100 z-50 overflow-hidden"
                            >
                              <div className="py-2 flex flex-col">
                                {userTab === 'intern' && (
                                  <>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setSelectedInternDetail(user); setOpenActionMenuId(null); }}
                                      className="px-4 py-2.5 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Eye className="w-4 h-4" /></div> Detail Peserta
                                    </button>
                                    <button 
                                      onClick={(e) => { 
                                        e.stopPropagation();
                                        setRubricTargetUser(user);
                                        const initialValues = {};
                                        rubricAspects.forEach(r => {
                                          initialValues[r.id] = user.rubricScores?.[r.id] || 0;
                                        });
                                        setRubricValues(initialValues);
                                        setShowRubricScoreModal(true);
                                        setOpenActionMenuId(null);
                                      }}
                                      className="px-4 py-2.5 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Star className="w-4 h-4" /></div> Update Nilai Akhir
                                    </button>
                                  </>
                                )}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingUserId(user.id);
                                    setEditUserName(user.name);
                                    setEditUserEmail(user.email);
                                    setEditUserRole(user.role);
                                    setEditUserStartup(user.startup || '');
                                    setEditUserNim(user.nim || '');
                                    setEditUserPhone(user.phone || '');
                                    setEditUserNickname(user.nickname || '');
                                    setEditUserLecturerCode(user.lecturerCode || '');
                                    setEditUserAdvisedStartups(user.advisedStartups ? user.advisedStartups.join(', ') : '');
                                    setEditUserPassword('');
                                    setOpenActionMenuId(null);
                                  }}
                                  className="px-4 py-2.5 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><Edit2 className="w-4 h-4" /></div> Edit Profil
                                </button>
                                <div className="h-px bg-neutral-100 my-1 mx-4"></div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); suspendUser(user.id, user.status !== 'suspended'); setOpenActionMenuId(null); }}
                                  className="px-4 py-2.5 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                                >
                                  <div className={\`w-8 h-8 rounded-lg flex items-center justify-center \${user.status === 'suspended' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}\`}><Ban className="w-4 h-4" /></div> {user.status === 'suspended' ? 'Aktifkan Akun' : 'Suspend Akun'}
                                </button>
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setOpenActionMenuId(null);
                                    const Swal = (await import('sweetalert2')).default;
                                    const res = await Swal.fire({
                                      title: 'Hapus pengguna?',
                                      text: "Data yang dihapus tidak dapat dikembalikan!",
                                      icon: 'warning',
                                      showCancelButton: true,
                                      confirmButtonColor: '#ef4444',
                                      cancelButtonColor: '#a3a3a3',
                                      confirmButtonText: 'Ya, Hapus!'
                                    });
                                    if(res.isConfirmed) {
                                      deleteUser(user.id);
                                      Swal.fire('Terhapus!', 'Pengguna telah dihapus.', 'success');
                                    }
                                  }}
                                  className="px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><Trash2 className="w-4 h-4" /></div> Hapus Pengguna
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  }
                ]}
              />`;

  content = content.substring(0, usersTableIndex) + dataTableUsers + content.substring(usersTableEndIndex);
  console.log("Replaced users table.");
} else {
  console.log("Could not find users table bounds");
}

fs.writeFileSync(file, content);
console.log("Done");
