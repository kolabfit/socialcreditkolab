import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store';
// @ts-ignore - motion/react type missing
import { motion, AnimatePresence } from 'motion/react';
import InternDetailModal from './InternDetailModal';
import { 
  Users, Activity, FileText, BarChart3, Edit2, Save, X, Ban, 
  Trash2, Plus, ArrowUpRight, ArrowDownRight, Upload, 
  ImageIcon, ShieldCheck, Star, ShieldAlert, User as UserIcon,
  Search, Filter, Eye, CheckCircle, AlertTriangle, MessageSquare, MoreVertical
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line } from 'recharts';
import { Role } from '../types';
import { getGrade } from '../utils';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from './Pagination';

// --- ADVANCED TABLE COMPONENT ---
const AdvancedTable = ({ title, data, columns, startups, onDetail, onScore, onFinalScore, onDelete }: any) => {
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  React.useEffect(() => {
    const handleClickOutside = () => setOpenActionMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  const [search, setSearch] = useState('');
  const [startupFilter, setStartupFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredData = data.filter((item: any) => {
    // A simplistic search across object values
    const matchesSearch = JSON.stringify(item).toLowerCase().includes(search.toLowerCase());
    const itemStartup = item.startup || item.targetStartup || 'None';
    const matchesStartup = startupFilter === 'All' || itemStartup === startupFilter;
    const itemStatus = item.status || 'Active';
    const matchesStatus = statusFilter === 'All' || itemStatus === statusFilter;
    return matchesSearch && matchesStartup && matchesStatus;
  });

  const pagination = usePagination(filteredData, 10);

  return (
    <div className="bg-white border border-neutral-100 rounded-3xl shadow-xl shadow-neutral-200/40 overflow-hidden">
      <div className="p-6 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-50/50">
        <h3 className="font-bold text-lg text-neutral-800">{title}</h3>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Cari data..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#EAB308] outline-none"
            />
          </div>
          <select 
            value={startupFilter}
            onChange={(e) => setStartupFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#EAB308] outline-none appearance-none cursor-pointer"
          >
            <option value="All">Semua Startup</option>
            {startups.map((s: any) => <option key={s.id || s.name} value={s.name}>{s.name}</option>)}
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#EAB308] outline-none appearance-none cursor-pointer"
          >
            <option value="All">Semua Status</option>
            <option value="Active">Aktif / Disetujui</option>
            <option value="Suspended">Suspended / Pending</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b-2 border-neutral-100">
              {columns.map((col: any, idx: number) => (
                <th key={idx} className="py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">{col.label}</th>
              ))}
              <th className="py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {pagination.currentData.map((row: any, rIdx: number) => (
              <tr key={rIdx} className="hover:bg-neutral-50/50 transition-colors group">
                {columns.map((col: any, cIdx: number) => (
                  <td key={cIdx} className="py-4 px-6 text-sm font-medium text-neutral-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                <td className="py-4 px-6 text-right">
                  <div className="relative inline-block text-left opacity-100">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionMenuId(openActionMenuId === row.id ? null : row.id);
                      }}
                      className="w-8 h-8 rounded-lg text-neutral-500 hover:bg-neutral-100 flex items-center justify-center transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    <AnimatePresence>
                      {openActionMenuId === row.id && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-10 mt-1 w-48 bg-white rounded-xl shadow-xl border border-neutral-100 z-50 overflow-hidden"
                        >
                          <div className="py-1 flex flex-col">
                            {onDetail && (
                              <button onClick={(e) => { e.stopPropagation(); setOpenActionMenuId(null); onDetail(row); }} className="px-4 py-2.5 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors">
                                <div className="w-6 h-6 rounded flex items-center justify-center bg-blue-50 text-blue-600"><Eye className="w-3.5 h-3.5" /></div> Detail
                              </button>
                            )}
                            {onScore && (
                              <button onClick={(e) => { e.stopPropagation(); setOpenActionMenuId(null); onScore(row); }} className="px-4 py-2.5 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors">
                                <div className="w-6 h-6 rounded flex items-center justify-center bg-[#fef8e6] text-[#EAB308]"><Star className="w-3.5 h-3.5" /></div> Beri Nilai
                              </button>
                            )}
                            {onFinalScore && (
                              <button onClick={(e) => { e.stopPropagation(); setOpenActionMenuId(null); onFinalScore(row); }} className="px-4 py-2.5 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors">
                                <div className="w-6 h-6 rounded flex items-center justify-center bg-blue-50 text-blue-600"><Star className="w-3.5 h-3.5" /></div> Update Nilai Akhir
                              </button>
                            )}
                            {onDelete && (
                              <button onClick={(e) => { e.stopPropagation(); setOpenActionMenuId(null); onDelete(row); }} className="px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                                <div className="w-6 h-6 rounded flex items-center justify-center bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></div> Hapus
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="py-8 text-center text-sm font-medium text-neutral-500">Tidak ada data ditemukan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination {...pagination} />
    </div>
  );
};


export default function AcademicDashboard({ activeTab, setActiveTab }: { activeTab: string, setActiveTab?: (tab: any) => void }) {
  const { 
    users, reports, updateScore, updateUser, deleteUser, 
    suspendUser, addReport, deleteReport, addUser, currentUser, rubricAspects, 
    startups, activities, updateActivityStatus
  } = useAppContext();

  const advisedStartups = currentUser?.advisedStartups || [];
  const mentoredStartups = startups.filter(s => advisedStartups.includes(s.name));
  
  const interns = currentUser?.role === 'field'
    ? users.filter(u => u.role === 'intern')
    : users.filter(u => u.role === 'intern' && u.startup && advisedStartups.includes(u.startup));
  
  // Dashboard Metrics
  const totalPeserta = interns.length;
  const avgScoreIndividu = totalPeserta > 0 ? Math.round(interns.reduce((acc, curr) => acc + curr.score, 0) / totalPeserta) : 0;
  
  const uniqueStartups = Array.from(new Set(interns.map(i => i.startup).filter(Boolean))) as string[];
  const calculateStartupScore = (startupName: string) => {
     const startupInterns = interns.filter(i => i.startup === startupName);
     return startupInterns.length ? Math.round(startupInterns.reduce((acc, curr) => acc + curr.score, 0) / startupInterns.length) : 0;
  };
  const avgStartupScore = uniqueStartups.length ? Math.round(uniqueStartups.reduce((acc, s) => acc + calculateStartupScore(s), 0) / uniqueStartups.length) : 0;
  
  // Score Management States
  const [chartFilter, setChartFilter] = useState<'hari' | 'bulan' | 'tahun'>('bulan');
  const [targetType, setTargetType] = useState<'intern' | 'startup'>('intern');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [showRubricScoreModal, setShowRubricScoreModal] = useState(false);
  const [rubricTargetUser, setRubricTargetUser] = useState<any>(null);
  const [rubricValues, setRubricValues] = useState<Record<string, number>>({});

  const [reportType, setReportType] = useState<'good' | 'bad'>('good');
  const [description, setDescription] = useState('');
  const [pointsImpact, setPointsImpact] = useState<number>(5);
  const [selectedAspectId, setSelectedAspectId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedInternDetail, setSelectedInternDetail] = useState<any>(null);

  // Profile States
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileLecturerCode, setProfileLecturerCode] = useState(currentUser?.lecturerCode || '');
  const [profileAdvisedStartups, setProfileAdvisedStartups] = useState<string[]>(currentUser?.advisedStartups || []);
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(currentUser?.photoUrl || '');
  
  React.useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileLecturerCode(currentUser.lecturerCode || '');
      setProfileAdvisedStartups(currentUser.advisedStartups || []);
      setProfileEmail(currentUser.email || '');
      setProfilePhoto(currentUser.photoUrl || '');
    }
  }, [currentUser]);
  
  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const Swal = (await import('sweetalert2')).default;
    if (profilePassword && profilePassword !== profileConfirmPassword) {
      Swal.fire('Gagal', 'Password konfirmasi tidak cocok!', 'error');
      return;
    }
    
    Swal.fire({
      title: 'Memproses...',
      text: 'Memperbarui profil',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await updateUser(currentUser.id, {
        name: profileName,
        lecturerCode: profileLecturerCode,
        advisedStartups: profileAdvisedStartups,
        password: profilePassword || currentUser.password,
        photoUrl: profilePhoto,
        email: profileEmail
      });
      setProfilePassword('');
      setProfileConfirmPassword('');
      Swal.fire('Berhasil', 'Profil berhasil diperbarui!', 'success');
    } catch (error: any) {
      Swal.fire('Gagal', 'Profil gagal diperbarui: ' + error.message, 'error');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId || !currentUser) return;
    
    const Swal = (await import('sweetalert2')).default;
    Swal.fire({
      title: 'Memproses...',
      text: 'Menyimpan penilaian',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await addReport({
        targetId: selectedTargetId,
        targetType: targetType,
        reporterId: currentUser.id,
        date: new Date().toISOString(),
        type: reportType,
        description,
        photoUrl,
        aspectId: selectedAspectId || undefined,
        pointsImpact: reportType === 'good' ? Math.abs(pointsImpact) : -Math.abs(pointsImpact),
      });
      
      setDescription('');
      setPhotoUrl('');
      setPointsImpact(5);
      setSelectedAspectId('');
      Swal.fire('Berhasil', 'Penilaian berhasil disimpan!', 'success');
    } catch (error: any) {
      Swal.fire('Gagal', 'Penilaian gagal disimpan: ' + error.message, 'error');
    }
  };

  // Generate Dynamic Chart Data
  const scoreTrendData = React.useMemo(() => {
    if (interns.length === 0) return [];
    
    const currentDate = new Date();
    const trendData = [];
    
    if (chartFilter === 'hari') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(currentDate);
        targetDate.setDate(targetDate.getDate() - i);
        const endOfTargetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59).getTime();
        
        let sumScores = 0;
        interns.forEach(intern => {
          const futureReports = reports.filter(r => r.targetId === intern.id && new Date(r.date).getTime() > endOfTargetDay);
          const futurePointsImpact = futureReports.reduce((sum, r) => sum + (r.pointsImpact || 0), 0);
          sumScores += (intern.score - futurePointsImpact);
        });
        
        trendData.push({
          name: targetDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          score: Math.max(0, Math.round(sumScores / interns.length))
        });
      }
    } else if (chartFilter === 'bulan') {
      // Last 6 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      for (let i = 5; i >= 0; i--) {
        let targetMonthIndex = currentMonth - i;
        let targetYear = currentYear;
        if (targetMonthIndex < 0) {
          targetMonthIndex += 12;
          targetYear -= 1;
        }
        
        const endOfTargetMonth = new Date(targetYear, targetMonthIndex + 1, 0, 23, 59, 59).getTime();
        
        let sumScores = 0;
        interns.forEach(intern => {
          const futureReports = reports.filter(r => r.targetId === intern.id && new Date(r.date).getTime() > endOfTargetMonth);
          const futurePointsImpact = futureReports.reduce((sum, r) => sum + (r.pointsImpact || 0), 0);
          sumScores += (intern.score - futurePointsImpact);
        });
        
        trendData.push({
          name: months[targetMonthIndex],
          score: Math.max(0, Math.round(sumScores / interns.length))
        });
      }
    } else if (chartFilter === 'tahun') {
      // Last 5 years
      const currentYear = currentDate.getFullYear();
      for (let i = 4; i >= 0; i--) {
        const targetYear = currentYear - i;
        const endOfTargetYear = new Date(targetYear, 11, 31, 23, 59, 59).getTime();
        
        let sumScores = 0;
        interns.forEach(intern => {
          const futureReports = reports.filter(r => r.targetId === intern.id && new Date(r.date).getTime() > endOfTargetYear);
          const futurePointsImpact = futureReports.reduce((sum, r) => sum + (r.pointsImpact || 0), 0);
          sumScores += (intern.score - futurePointsImpact);
        });
        
        trendData.push({
          name: targetYear.toString(),
          score: Math.max(0, Math.round(sumScores / interns.length))
        });
      }
    }
    
    return trendData;
  }, [interns, reports, chartFilter]);

  const topPerformers = React.useMemo(() => [...interns].filter(i => i.score >= 70).sort((a, b) => b.score - a.score).slice(0, 3), [interns]);
  const needsAttention = React.useMemo(() => [...interns].filter(i => i.score < 70).sort((a, b) => a.score - b.score).slice(0, 3), [interns]);

  // Columns for Tables
  const userColumns = [
    { key: 'name', label: 'Nama Peserta', render: (row: any) => <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-neutral-200 overflow-hidden">{row.photoUrl ? <img src={row.photoUrl} className="w-full h-full object-cover"/> : <UserIcon className="w-full h-full p-1.5 text-neutral-400" />}</div><span className="font-bold">{row.name}</span></div> },
    { key: 'startup', label: 'Startup', render: (row: any) => <span className="text-xs font-bold bg-[#EAB308]/10 text-yellow-700 px-3 py-1.5 rounded-lg border border-[#EAB308]/20">{row.startup || '-'}</span> },
    { key: 'score', label: 'Skor Saat Ini', render: (row: any) => <span className="font-black text-lg">{row.score}</span> },
    { key: 'status', label: 'Status', render: (row: any) => <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${row.status === 'suspended' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>{row.status === 'suspended' ? 'Suspended' : 'Aktif'}</span> },
  ];



  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        
        {/* 1. Halaman Dashboard */}
        {activeTab === 'dashboard' && (
          <motion.div key="dashboard" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6">
            {/* Top Bar - Yellow Panel */}
            <div className="bg-[#EAB308] rounded-3xl p-8 text-black shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border-b-[8px] border-black/10">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
              
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="bg-black/5 rounded-2xl p-5 border border-black/5 flex flex-col justify-center">
                  <span className="text-black/60 font-black text-sm uppercase tracking-wider mb-1">Total Peserta Magang</span>
                  <div className="text-4xl font-black">{totalPeserta}</div>
                </div>
                <div className="bg-black/5 rounded-2xl p-5 border border-black/5 flex flex-col justify-center">
                  <span className="text-black/60 font-black text-sm uppercase tracking-wider mb-1">Rata-rata Skor Individu</span>
                  <div className="text-4xl font-black">{avgScoreIndividu}</div>
                </div>
                <div className="bg-black/5 rounded-2xl p-5 border border-black/5 flex flex-col justify-center">
                  <span className="text-black/60 font-black text-sm uppercase tracking-wider mb-1">Rata-rata Skor Startup</span>
                  <div className="text-4xl font-black">{avgStartupScore}</div>
                </div>
              </div>

              <div className="shrink-0 w-full md:w-auto relative z-10 flex items-center">
                <button 
                  onClick={() => setActiveTab?.('scores')} className="w-full md:w-auto bg-black text-white hover:bg-neutral-800 px-8 py-5 rounded-2xl font-black transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 text-lg group"
                >
                  <Star className="w-6 h-6 text-[#EAB308] group-hover:rotate-12 transition-transform" /> Beri Penilaian
                </button>
              </div>
            </div>

            {/* Charts Area */}
            <div className="w-full">
              {/* Line Chart */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-200/40">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                  <h3 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#EAB308]" /> Tren Skor Keseluruhan
                  </h3>
                  <div className="flex bg-neutral-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setChartFilter('hari')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${chartFilter === 'hari' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                    >
                      Hari
                    </button>
                    <button 
                      onClick={() => setChartFilter('bulan')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${chartFilter === 'bulan' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                    >
                      Bulan
                    </button>
                    <button 
                      onClick={() => setChartFilter('tahun')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${chartFilter === 'tahun' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                    >
                      Tahun
                    </button>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a3a3a3', fontSize: 12, fontWeight: 'bold'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#a3a3a3', fontSize: 12}} dx={-10} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="score" stroke="#171717" strokeWidth={4} dot={{r: 6, fill: '#EAB308', strokeWidth: 3, stroke: '#171717'}} activeDot={{r: 8, fill: '#EAB308', stroke: '#171717'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Bottom Area - Split 2 Kolom */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-200/40">
                <h3 className="font-bold text-lg text-neutral-800 mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" /> Top Performers
                </h3>
                <div className="space-y-4">
                  {topPerformers.map((intern, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-[#EAB308]/20 flex items-center justify-center text-yellow-700 font-bold">
                           {i + 1}
                         </div>
                         <div>
                           <p className="font-bold text-neutral-800">{intern.name}</p>
                           <p className="text-xs font-semibold text-neutral-500">{intern.startup}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-2xl font-black text-black">{intern.score}</p>
                      </div>
                    </div>
                  ))}
                  {topPerformers.length === 0 && <p className="text-center text-sm text-neutral-500 py-4">Belum ada data.</p>}
                </div>
              </div>

              {/* Needs Attention */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-200/40">
                <h3 className="font-bold text-lg text-neutral-800 mb-6 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" /> Needs Attention
                </h3>
                <div className="space-y-4">
                  {needsAttention.map((intern, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-red-50 border border-red-100">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                           <AlertTriangle className="w-5 h-5" />
                         </div>
                         <div>
                           <p className="font-bold text-neutral-800">{intern.name}</p>
                           <p className="text-xs font-semibold text-neutral-500">{intern.startup}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="text-xs font-bold bg-red-200 text-red-800 px-3 py-1 rounded-lg">Skor Merah</span>
                         <p className="text-lg font-black text-red-600 mt-1">{intern.score}</p>
                      </div>
                    </div>
                  ))}
                  {needsAttention.length === 0 && <p className="text-center text-sm text-neutral-500 py-4">Semua peserta dalam kondisi baik.</p>}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. Halaman Penilaian Score */}
        {activeTab === 'scores' && (
          <motion.div key="scores" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="max-w-3xl mx-auto py-8">
            <div className="bg-white p-8 md:p-10 rounded-3xl border border-neutral-100 shadow-2xl shadow-neutral-200/50">
              <h2 className="text-2xl font-black text-neutral-800 flex items-center gap-3 mb-8">
                <div className="p-3 bg-black rounded-xl text-[#EAB308] shadow-lg shadow-black/10">
                  <Star className="w-6 h-6" />
                </div>
                Beri Penilaian Social Credit
              </h2>
              
              <form onSubmit={handleReportSubmit} className="space-y-8">
                {/* Tabs */}
                <div className="flex p-1.5 bg-neutral-100 rounded-2xl mb-6">
                  <button 
                    type="button" 
                    onClick={() => setTargetType('intern')}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${targetType === 'intern' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'}`}
                  >
                    Peserta Magang
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setTargetType('startup')}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${targetType === 'startup' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'}`}
                  >
                    Tim Startup
                  </button>
                </div>

                {/* Target Dropdown */}
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2 uppercase tracking-wide">
                    Pilih {targetType === 'intern' ? 'Peserta' : 'Startup'}
                  </label>
                  <select 
                    required
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] outline-none font-medium appearance-none cursor-pointer transition-all"
                  >
                    <option value="">-- Pilih --</option>
                    {targetType === 'intern' 
                      ? interns.map(i => <option key={i.id} value={i.id}>{i.name} ({i.startup || '-'})</option>)
                      : mentoredStartups.map(s => <option key={s.id || s.name} value={s.name}>{s.name}</option>)
                    }
                  </select>
                  {selectedTargetId && targetType === 'intern' && (
                    <p className="text-xs font-bold text-neutral-500 mt-2 ml-1 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5" /> Skor Saat Ini: {interns.find(i => i.id === selectedTargetId)?.score || 0}
                    </p>
                  )}
                </div>

                {/* Toggle Button */}
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2 uppercase tracking-wide">Jenis Tindakan</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setReportType('good')}
                      className={`p-4 rounded-2xl border-2 font-bold flex flex-col items-center justify-center gap-2 transition-all ${reportType === 'good' ? 'border-green-500 bg-green-50 text-green-700' : 'border-neutral-200 bg-white text-neutral-400 hover:border-green-200'}`}
                    >
                      <ArrowUpRight className="w-6 h-6" /> Tindakan Baik
                    </button>
                    <button 
                      type="button"
                      onClick={() => setReportType('bad')}
                      className={`p-4 rounded-2xl border-2 font-bold flex flex-col items-center justify-center gap-2 transition-all ${reportType === 'bad' ? 'border-red-500 bg-red-50 text-red-700' : 'border-neutral-200 bg-white text-neutral-400 hover:border-red-200'}`}
                    >
                      <ArrowDownRight className="w-6 h-6" /> Tindakan Buruk
                    </button>
                  </div>
                </div>

                {/* Points & Desc */}
                {/* Points & Desc */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2 uppercase tracking-wide">Aspek Nilai (Opsional)</label>
                    <select
                      value={selectedAspectId}
                      onChange={(e) => {
                        setSelectedAspectId(e.target.value);
                        const aspect = rubricAspects.find(a => a.id === e.target.value);
                        if(aspect) setPointsImpact(aspect.weight);
                      }}
                      className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] outline-none font-medium appearance-none cursor-pointer transition-all"
                    >
                      <option value="">Pilih Aspek Penilaian...</option>
                      {rubricAspects.map(aspect => (
                        <option key={aspect.id} value={aspect.id}>{aspect.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2 uppercase tracking-wide">Dampak Poin</label>
                    <input 
                      type="number" required min="1" max="100"
                      value={pointsImpact}
                      onChange={(e) => setPointsImpact(Number(e.target.value))}
                      className="w-full p-4 text-center text-2xl font-black bg-neutral-50 border border-neutral-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2 mt-4 uppercase tracking-wide">Keterangan Penilaian</label>
                  <textarea 
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Jelaskan alasan pemberian poin..."
                    className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] outline-none transition-all resize-none h-24 text-sm font-medium"
                  />
                </div>

                {/* Upload Area */}
                <div>
                   <label className="block text-sm font-bold text-neutral-700 mb-2 uppercase tracking-wide">Bukti Foto / Dokumen (Opsional)</label>
                   <div className="border-2 border-dashed border-neutral-300 rounded-2xl p-8 text-center hover:bg-neutral-50 transition-colors relative cursor-pointer group">
                      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-neutral-400 shadow-sm border border-neutral-100 group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="block text-sm font-bold text-neutral-700">Tarik dan lepas file di sini</span>
                          <span className="block text-xs font-semibold text-neutral-400 mt-1">Atau klik untuk memilih file dari komputer</span>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="pt-4 border-t border-neutral-100">
                  <button 
                    type="submit"
                    className="w-full bg-[#EAB308] text-black hover:bg-yellow-400 font-black py-4 rounded-xl transition-all shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-2 group text-lg"
                  >
                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform" /> Simpan Penilaian
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* 3. Data Tables */}
        {activeTab === 'users' && (
          <motion.div key="users" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
            <AdvancedTable 
              title="Data Peserta Magang"
              data={interns}
              columns={userColumns}
              startups={startups}
              onDetail={(row: any) => setSelectedInternDetail(row)}
              onScore={(row: any) => {
                setSelectedTargetId(row.id);
                setTargetType('intern');
                if (setActiveTab) setActiveTab('scores');
              }}
              onFinalScore={(row: any) => {
                 setRubricTargetUser(row);
                 const initialValues: Record<string, number> = {};
                 rubricAspects.forEach(r => {
                   initialValues[r.id] = row.rubricScores?.[r.id] || 0;
                 });
                 setRubricValues(initialValues);
                 setShowRubricScoreModal(true);
              }}
              onDelete={async (row: any) => {
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
                  deleteUser(row.id);
                  Swal.fire('Terhapus!', 'Pengguna telah dihapus.', 'success');
                }
              }}
            />
          </motion.div>
        )}



        {activeTab === 'reports' && (
          <motion.div key="reports" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
            <AdvancedTable 
              title="Riwayat Penilaian (Laporan)"
              data={reports}
              columns={[
                { key: 'date', label: 'Tanggal', render: (row: any) => new Date(row.date).toLocaleDateString() },
                { key: 'reporter', label: 'Penilai', render: (row: any) => <span className="text-xs font-bold text-neutral-700">{users.find(u => u.id === row.reporterId)?.name || 'Unknown'}</span> },
                { key: 'target', label: 'Target Evaluasi', render: (row: any) => {
                  const targetUser = users.find(u => u.id === row.targetId);
                  const targetName = row.targetType === 'startup' ? row.targetId : (targetUser?.name || 'Unknown');
                  return (
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-xs">{targetName}</span>
                      <div className="flex items-center gap-1">
                        {row.targetType === 'startup' ? (
                          <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold uppercase">Startup</span>
                        ) : (
                          <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">Individu</span>
                        )}
                        {targetUser?.startup && row.targetType !== 'startup' && (
                          <span className="text-[9px] text-neutral-500 font-medium">({targetUser.startup})</span>
                        )}
                      </div>
                    </div>
                  );
                }},
                { key: 'description', label: 'Keterangan', render: (row: any) => <span className="text-xs">{row.description}</span> },
                { key: 'pointsImpact', label: 'Poin', render: (row: any) => <span className={`font-bold ${row.pointsImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>{row.pointsImpact > 0 ? '+' : ''}{row.pointsImpact}</span> }
              ]}
              startups={startups}
              onDelete={async (row: any) => {
                const Swal = (await import('sweetalert2')).default;
                const res = await Swal.fire({
                  title: 'Hapus riwayat penilaian?',
                  text: "Data yang dihapus tidak dapat dikembalikan!",
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: '#ef4444',
                  cancelButtonColor: '#a3a3a3',
                  confirmButtonText: 'Ya, Hapus!'
                });
                if(res.isConfirmed) {
                  deleteReport(row.id);
                  Swal.fire('Terhapus!', 'Riwayat penilaian telah dihapus.', 'success');
                }
              }}
            />
          </motion.div>
        )}

        {/* 4. Halaman Edit Profil */}
            
            {activeTab === 'profile' && (
          <motion.div key="profile" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="max-w-4xl mx-auto py-8">
            <div className="mb-8">
              <h3 className="font-black text-3xl text-neutral-800 mb-2 tracking-tight">Profil & Pengaturan</h3>
              <p className="text-neutral-500 font-semibold">Kelola informasi pribadi dan akses keamanan Anda.</p>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="bg-white border border-neutral-200 rounded-3xl shadow-2xl shadow-neutral-200/40 overflow-hidden">
               <div className="grid grid-cols-1 md:grid-cols-12 gap-0 divide-y md:divide-y-0 md:divide-x divide-neutral-100">
                 
                 {/* Left Column - Avatar & Basic Info */}
                 <div className="col-span-1 md:col-span-5 p-8 bg-neutral-50/50">
                    <div className="flex flex-col items-center text-center mb-10">
                      <div className="w-40 h-40 rounded-full bg-white border-4 border-white shadow-xl overflow-hidden relative group mb-6">
                        {profilePhoto ? (
                          <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-300 bg-neutral-100">
                            <UserIcon className="w-16 h-16" />
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs font-bold gap-2">
                          <Upload className="w-6 h-6 text-[#EAB308]" />
                          Ubah Foto
                          <input type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoUpload} />
                        </label>
                      </div>
                      <h4 className="font-black text-2xl text-neutral-800 tracking-tight">{currentUser.name}</h4>
                      <p className="text-sm font-bold text-[#EAB308] mt-1 bg-[#EAB308]/10 px-4 py-1.5 rounded-full inline-block">Pembimbing Akademik</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest mb-3">Nama Lengkap</label>
                        <input 
                          type="text" required 
                          value={profileName} 
                          onChange={(e) => setProfileName(e.target.value)} 
                          className="w-full p-4 bg-white border border-neutral-200 rounded-2xl outline-none font-bold text-neutral-800 focus:ring-2 focus:ring-[#EAB308] transition-all shadow-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest mb-3">Kode Dosen</label>
                        <input 
                          type="text" 
                          value={profileLecturerCode} 
                          onChange={(e) => setProfileLecturerCode(e.target.value)} 
                          className="w-full p-4 bg-white border border-neutral-200 rounded-2xl outline-none font-bold text-neutral-800 focus:ring-2 focus:ring-[#EAB308] transition-all shadow-sm" 
                        />
                      </div>
                    </div>
                 </div>

                 {/* Right Column - Academic & Security */}
                 <div className="col-span-1 md:col-span-7 p-8 md:p-10 flex flex-col justify-between">
                    <div className="space-y-10">
                      
                      {/* Startup Section */}
                      <div className="space-y-6">
                        <h4 className="font-black text-lg text-neutral-800 flex items-center gap-3 border-b-2 border-neutral-100 pb-4">
                          <Activity className="w-5 h-5 text-[#EAB308]" /> Startup Binaan
                        </h4>
                        <div>
                          <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest mb-3">Tim Startup (Bisa Pilih Lebih Dari Satu)</label>
                          
                          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto p-4 bg-neutral-50 border border-neutral-200 rounded-xl focus-within:ring-2 focus-within:ring-[#EAB308] focus-within:border-[#EAB308] transition-all">
                            {startups.map(s => (
                              <label key={s.id} className="flex items-center gap-3 cursor-pointer text-sm font-medium text-neutral-700 p-2 hover:bg-white rounded-lg transition-colors">
                                <input
                                  type="checkbox"
                                  value={s.name}
                                  checked={profileAdvisedStartups.includes(s.name)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setProfileAdvisedStartups([...profileAdvisedStartups, s.name]);
                                    } else {
                                      setProfileAdvisedStartups(profileAdvisedStartups.filter(name => name !== s.name));
                                    }
                                  }}
                                  className="w-5 h-5 text-[#EAB308] rounded border-neutral-300 focus:ring-[#EAB308]"
                                />
                                <span>{s.name}</span>
                              </label>
                            ))}
                            {startups.length === 0 && <span className="text-neutral-400 text-xs italic">Belum ada startup terdaftar</span>}
                          </div>

                        </div>
                      </div>

                      {/* Security Section */}
                      <div className="space-y-6">
                        <h4 className="font-black text-lg text-neutral-800 flex items-center gap-3 border-b-2 border-neutral-100 pb-4">
                          <ShieldCheck className="w-5 h-5 text-[#EAB308]" /> Keamanan Akun
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest mb-3">Email Login</label>
                            <input 
                              type="email"
                              value={profileEmail}
                              onChange={(e) => setProfileEmail(e.target.value)}
                              className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none font-bold text-neutral-800 focus:bg-white focus:ring-2 focus:ring-[#EAB308] transition-all" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest mb-3">Password Baru</label>
                            <input 
                              type="password" 
                              value={profilePassword} 
                              onChange={(e) => setProfilePassword(e.target.value)} 
                              className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none font-bold text-neutral-800 focus:bg-white focus:ring-2 focus:ring-[#EAB308] transition-all" 
                              placeholder="Ketik password baru" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest mb-3">Konfirmasi Password</label>
                            <input 
                              type="password" 
                              value={profileConfirmPassword} 
                              onChange={(e) => setProfileConfirmPassword(e.target.value)} 
                              className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none font-bold text-neutral-800 focus:bg-white focus:ring-2 focus:ring-[#EAB308] transition-all" 
                              placeholder="Ketik ulang password" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-10 mt-10 border-t-2 border-neutral-100 flex justify-end">
                      <button 
                        type="submit" 
                        className="px-10 py-4 bg-[#EAB308] text-black rounded-2xl font-black text-lg hover:bg-yellow-400 hover:-translate-y-1 transition-all shadow-xl shadow-yellow-500/30 flex items-center gap-3"
                      >
                        <CheckCircle className="w-6 h-6" /> Simpan Perubahan
                      </button>
                    </div>
                 </div>

               </div>
            </form>
          </motion.div>
        )}

      </AnimatePresence>
      {selectedInternDetail && (
        <InternDetailModal 
          intern={selectedInternDetail} 
          onClose={() => setSelectedInternDetail(null)} 
          activities={activities} 
          reports={reports} 
          users={users}
        />
      )}

      {showRubricScoreModal && rubricTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto pt-20 pb-10">
          <motion.div 
            initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-neutral-100 my-auto"
          >
            <div className="px-8 py-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50 sticky top-0 z-10">
              <h3 className="font-bold text-lg text-neutral-800">Update Nilai Akhir</h3>
              <button onClick={() => setShowRubricScoreModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-black hover:bg-neutral-200 transition-colors">
                ✕
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              let oldWeightedSum = 0;
              rubricAspects.forEach(r => {
                oldWeightedSum += (rubricTargetUser.rubricScores?.[r.id] || 0) * (r.weight / 100);
              });
              oldWeightedSum = Math.round(oldWeightedSum);
              const bonusPoints = (rubricTargetUser.score || 0) - oldWeightedSum;

              let newWeightedSum = 0;
              rubricAspects.forEach(r => {
                newWeightedSum += (rubricValues[r.id] || 0) * (r.weight / 100);
              });
              newWeightedSum = Math.round(newWeightedSum);
              
              const totalScore = newWeightedSum + bonusPoints;
              updateScore(rubricTargetUser.id, totalScore, rubricValues);
              setShowRubricScoreModal(false);
              import('sweetalert2').then(Swal => Swal.default.fire('Berhasil', 'Nilai akhir berhasil diperbarui (Skala: ' + getGrade(totalScore) + ')', 'success'));
            }} className="p-8 space-y-5">
              <div className="mb-6 border-b border-neutral-100 pb-4">
                <p className="text-sm font-semibold text-neutral-500">Peserta Magang</p>
                <p className="text-xl font-bold">{rubricTargetUser.name}</p>
              </div>

              {rubricAspects.map(rubric => (
                <div key={rubric.id} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-neutral-700">{rubric.name}</label>
                    <span className="text-xs font-bold bg-neutral-100 text-neutral-500 px-2 py-1 rounded">Bobot: {rubric.weight}%</span>
                  </div>
                  <input 
                    type="number" required min="0" max="100"
                    value={rubricValues[rubric.id] !== undefined ? rubricValues[rubric.id] : ''}
                    onChange={(e) => {
                      let val = e.target.value === '' ? '' : Number(e.target.value);
                      if (typeof val === 'number') {
                        val = Math.max(0, Math.min(100, val));
                      }
                      setRubricValues({...rubricValues, [rubric.id]: val === '' ? 0 : val});
                    }}
                    className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] focus:border-[#EAB308] outline-none font-medium transition-all"
                    placeholder="Nilai 0 - 100"
                  />
                </div>
              ))}
              
              <div className="mt-8 pt-6 border-t border-neutral-100">
                <p className="text-sm font-bold text-indigo-900 mb-1">Prediksi Nilai Akhir</p>
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <p className="text-sm text-indigo-800">Nilai akan dikalkulasi otomatis sesuai bobot masing-masing aspek ditambah dengan poin social credit (+/-) yang sudah dikumpulkan sebelumnya.</p>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#EAB308] text-black hover:bg-yellow-400 font-bold py-4 rounded-xl transition-all shadow-xl shadow-yellow-500/20"
              >
                Simpan Nilai Akhir
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
