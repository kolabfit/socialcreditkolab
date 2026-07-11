import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../store';
// @ts-ignore - motion/react type missing
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Send, FileText, CheckCircle, Activity, Star, AlertCircle, X, ArrowUpRight, ArrowDownRight, User as UserIcon, BarChart3, Clock, Upload, ChevronLeft, ChevronRight, Search, Filter, ChevronDown , ScanFace } from 'lucide-react';
import { getGrade } from '../utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Cell, PieChart, Pie, BarChart, Bar } from 'recharts';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from './Pagination';
import Swal from 'sweetalert2';

export default function InternDashboard({ activeTab = 'dashboard', setActiveTab }: { activeTab?: string, setActiveTab?: (tab: any) => void }) {
  const { currentUser, updateUser, reports, startups, users, activities, addActivity } = useAppContext();
  
  // Incident Form
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [incidentAttachment, setIncidentAttachment] = useState<File | null>(null);

  // Profile States
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileNickname, setProfileNickname] = useState(currentUser?.nickname || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileNim, setProfileNim] = useState(currentUser?.nim || '');
  const [profileStartup, setProfileStartup] = useState(currentUser?.startup || '');
  const [profileLecturer, setProfileLecturer] = useState(currentUser?.lecturerCode || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(currentUser?.photoUrl || '');

  // History Table States
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('All');

  // Chart Filter State
  const [chartFilter, setChartFilter] = useState('7');

  const academics = users.filter(u => u.role === 'academic');

  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    Swal.fire({
      title: 'Memproses...',
      text: 'Mengirim laporan',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      let attachmentUrl = undefined;
      if (incidentAttachment) {
        attachmentUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(incidentAttachment);
        });
      }
      
      await addActivity({
        intern_id: currentUser.id,
        type: 'kejadian',
        date: incidentDate,
        title: incidentTitle,
        description: incidentDesc,
        attachment_url: attachmentUrl,
        status: 'pending'
      });

      Swal.fire('Berhasil', 'Laporan kejadian Anda telah dikirim.', 'success');
      setIncidentTitle('');
      setIncidentDesc('');
      setIncidentAttachment(null);
    } catch (error: any) {
      console.error('Error submitting incident:', error);
      Swal.fire('Gagal', 'Laporan gagal dikirim: ' + error.message, 'error');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (profilePassword && profilePassword !== profileConfirmPassword) {
      Swal.fire('Gagal', 'Password konfirmasi tidak cocok!', 'error');
      return;
    }

    const updates = {
      name: profileName,
      nickname: profileNickname,
      phone: profilePhone,
      nim: profileNim,
      startup: profileStartup,
      lecturerCode: profileLecturer,
      password: profilePassword || currentUser.password,
      photoUrl: profilePhoto,
      email: profileEmail
    };
    
    Swal.fire({
      title: 'Memproses...',
      text: 'Memperbarui profil',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await updateUser(currentUser.id, updates);
      
      const Toast = Swal.mixin({
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      Toast.fire({
        icon: "success",
        title: "Profil berhasil diperbarui!"
      });
    } catch (error: any) {
      console.error(error);
      Swal.fire('Gagal', 'Profil gagal diperbarui: ' + error.message, 'error');
    }
  };

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

  if (!currentUser) return null;

  const myActivities = activities.filter(a => (a.intern_id || a.internId) === currentUser.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const myReports = reports.filter(r => r.targetId === currentUser.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Mock Score Trend Data
  const scoreTrendData7 = [
    { label: 'Sen', score: 95 },
    { label: 'Sel', score: 95 },
    { label: 'Rab', score: 100 },
    { label: 'Kam', score: 105 },
    { label: 'Jum', score: 105 },
    { label: 'Sab', score: 110 },
    { label: 'Min', score: currentUser.score },
  ];

  const scoreTrendData30 = [
    { label: 'Minggu 1', score: 80 },
    { label: 'Minggu 2', score: 85 },
    { label: 'Minggu 3', score: 95 },
    { label: 'Minggu 4', score: currentUser.score },
  ];

  const currentScoreTrend = chartFilter === '7' ? scoreTrendData7 : scoreTrendData30;

  // Activity History
  const activityHistory = useMemo(() => {
    return myActivities.map(act => ({
      id: act.id,
      date: act.date,
      category: act.type === 'kejadian' ? 'Laporan Kejadian' : 'Laporan Harian',
      description: act.title || act.activity || 'Laporan',
      status: act.status === 'pending' ? 'Menunggu ACC' : (act.status === 'approved' ? 'Disetujui' : 'Ditolak'),
      attachment_url: act.attachment_url
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [myActivities]);

  // Report History
  const reportHistory = useMemo(() => {
    return myReports.map(rpt => ({
      id: rpt.id,
      date: rpt.date,
      category: 'Penilaian',
      description: rpt.description,
      status: rpt.type === 'good' ? 'Positif' : 'Negatif',
      evaluatorId: rpt.reporterId,
      impact: rpt.pointsImpact
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [myReports]);

  const paginationActivities = usePagination(activityHistory, 10);
  const paginationReports = usePagination(reportHistory, 10);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Positif':
      case 'In Time':
      case 'Disetujui':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Negatif':
      case 'Late':
      case 'Ditolak':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Menunggu ACC':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'On Time':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Menunggu':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight mb-2">Selamat datang, {currentUser.name}!</h1>
          <p className="text-neutral-500 font-medium">Target hari ini: <span className="text-black font-bold">Tingkatkan terus performa dan Social Credit Score Anda.</span></p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div key="dashboard" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Score Card */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-200/40 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#EAB308]/10 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-5 mb-4">
                  <div className="w-14 h-14 bg-[#EAB308] text-black rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                    <Star className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 font-semibold mb-1">Social Credit Score</p>
                    <div className="flex items-end gap-2">
                      <p className="text-4xl font-bold text-black">{currentUser.score}</p>
                      <p className="text-lg font-bold text-[#EAB308] pb-1">({getGrade(currentUser.score)})</p>
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs font-bold text-neutral-500 mb-1">
                    <span>Progress</span>
                    <span>150 max</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#EAB308] h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((currentUser.score / 150) * 100, 100)}%` }}></div>
                  </div>
                </div>
              </div>
              
              {/* Laporan Card */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-200/40 relative overflow-hidden flex flex-col justify-center">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#EAB308]/5 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-5 mb-4">
                  <div className="w-14 h-14 bg-black text-[#EAB308] rounded-2xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 font-semibold mb-1">Total Laporan Disetujui</p>
                    <div className="flex items-end gap-2">
                      <p className="text-4xl font-bold text-black">{myReports.filter((r: any) => r.type === 'good').length}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 inline-block rounded-md border border-green-100">
                    Terverifikasi oleh Pembimbing
                  </p>
                </div>
              </div>
            </div>

            {/* CHARTS FULL WIDTH */}
            <div className="grid grid-cols-1 gap-6">
              {/* Score Chart */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-200/40 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-neutral-800">Tren Social Credit Score</h3>
                  <div className="relative">
                    <select
                      value={chartFilter}
                      onChange={(e) => setChartFilter(e.target.value)}
                      className="appearance-none bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 text-xs font-bold py-1.5 pl-3 pr-8 rounded-lg outline-none transition-colors cursor-pointer"
                    >
                      <option value="7">7 Hari Terakhir</option>
                      <option value="30">30 Hari Terakhir</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={currentScoreTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#a3a3a3', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#a3a3a3', fontSize: 12}} dx={-10} domain={['dataMin - 10', 'dataMax + 10']} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#EAB308" strokeWidth={4} dot={{r: 6, fill: '#000', strokeWidth: 2, stroke: '#EAB308'}} activeDot={{r: 8, fill: '#EAB308', stroke: '#000'}} animationDuration={1000} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activities Timeline */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-200/40 flex flex-col lg:col-span-2">
                <h3 className="font-bold text-lg text-neutral-800 mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#EAB308]" /> Aktivitas Terbaru
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
                  {[...myReports, ...myActivities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((item, idx) => {
                    const isReport = 'pointsImpact' in item;
                    const isGood = isReport && (item as any).pointsImpact > 0;
                    
                    let evaluatorStr = '';
                    if (isReport) {
                      const rep = users.find(u => u.id === (item as any).reporterId);
                      if (rep) {
                         const roleStr = rep.role === 'academic' ? 'Pembimbing Akademik' : (rep.role === 'field' ? 'HR' : 'Peserta');
                         evaluatorStr = `Oleh: ${rep.name} - ${roleStr}`;
                      }
                    }
                    
                    return (
                      <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 border-white text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${isReport ? (isGood ? 'bg-green-500' : 'bg-red-500') : 'bg-[#EAB308]'}`}></div>
                        <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-neutral-400">{new Date(item.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</span>
                            {isReport && (
                              <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {isGood ? '+' : ''}{(item as any).pointsImpact} Poin
                              </span>
                            )}
                          </div>
                          
                          <span className="text-xs font-semibold text-neutral-800 leading-snug">
                            {isReport ? (item as any).description : (item as any).activity}
                          </span>
                          
                          {isReport && evaluatorStr && (
                            <span className="text-[10px] font-medium text-neutral-500 mt-1 italic">
                              {evaluatorStr}
                            </span>
                          )}
                          {!isReport && (
                            <span className="text-[10px] font-medium text-neutral-500 mt-1 italic">
                              Laporan Kegiatan Pribadi
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {myReports.length === 0 && myActivities.length === 0 && (
                    <p className="text-center text-sm text-neutral-500 font-medium py-8">Belum ada aktivitas.</p>
                  )}
                </div>
              </div>
              
              {/* Aksi Cepat */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-200/40 flex flex-col justify-center">
                <h3 className="font-bold text-lg text-neutral-800 mb-6 text-center">Aksi Cepat</h3>
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => setActiveTab?.('incidents')}
                    className="p-6 bg-neutral-50 hover:bg-[#EAB308]/10 hover:border-[#EAB308]/50 border border-neutral-200 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all text-neutral-700 hover:text-black group"
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm">Tulis Laporan Kejadian</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab?.('reports')}
                    className="p-6 bg-neutral-50 hover:bg-[#EAB308]/10 hover:border-[#EAB308]/50 border border-neutral-200 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all text-neutral-700 hover:text-black group"
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm">Lihat Riwayat</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}


        {activeTab === 'incidents' && (
          <motion.div key="incidents" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-200/40">
              <h3 className="text-2xl font-bold text-neutral-800 mb-6 flex items-center gap-2"><AlertCircle className="w-6 h-6 text-[#EAB308]" /> Form Laporan Kejadian</h3>
              <form onSubmit={handleSubmitIncident} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Tanggal Kejadian</label>
                    <input 
                      type="date" 
                      required
                      value={incidentDate}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setIncidentDate(e.target.value)}
                      className="w-full md:w-1/2 p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] outline-none transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Judul / Jenis Kejadian</label>
                    <input 
                      type="text" 
                      required
                      value={incidentTitle}
                      onChange={(e) => setIncidentTitle(e.target.value)}
                      className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] outline-none transition-all font-medium"
                      placeholder="Contoh: Kecelakaan Kerja, Kerusakan Alat, dll."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Deskripsi Kejadian</label>
                    <textarea 
                      required
                      value={incidentDesc}
                      onChange={(e) => setIncidentDesc(e.target.value)}
                      className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] outline-none transition-all resize-none h-32 text-sm leading-relaxed"
                      placeholder="Deskripsikan kronologi kejadian secara rinci..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Bukti Lampiran</label>
                    {incidentAttachment && incidentAttachment.type.startsWith('image/') ? (
                      <div className="relative w-full border-2 border-dashed border-[#EAB308] rounded-2xl p-4 flex flex-col items-center justify-center bg-yellow-50/30">
                        <img
                          src={URL.createObjectURL(incidentAttachment)}
                          alt="Preview"
                          className="max-h-48 rounded-xl object-contain mb-3"
                        />
                        <span className="text-sm font-bold text-neutral-700">{incidentAttachment.name}</span>
                        <button
                          type="button"
                          onClick={() => setIncidentAttachment(null)}
                          className="absolute top-3 right-3 p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : incidentAttachment ? (
                      <div className="relative w-full border-2 border-dashed border-[#EAB308] rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-yellow-50/30">
                        <FileText className="w-8 h-8 text-[#EAB308] mb-3" />
                        <span className="text-sm font-bold text-neutral-700">{incidentAttachment.name}</span>
                        <button
                          type="button"
                          onClick={() => setIncidentAttachment(null)}
                          className="absolute top-3 right-3 p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="file-upload-incident" className="w-full border-2 border-dashed border-neutral-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-neutral-50 transition-colors cursor-pointer group block">
                        <Upload className="w-6 h-6 text-neutral-400 group-hover:text-[#EAB308] mb-3 transition-colors pointer-events-none" />
                        <span className="text-sm font-bold text-neutral-700 pointer-events-none">Pilih file bukti atau tarik ke sini</span>
                        <span className="text-xs text-neutral-500 font-medium mt-1 pointer-events-none">PDF, JPG, PNG (Max 5MB)</span>
                        <input id="file-upload-incident" type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => setIncidentAttachment(e.target.files?.[0] || null)} />
                      </label>
                    )}
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-[#EAB308] hover:bg-yellow-400 text-black rounded-2xl font-bold shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" /> Kirim Laporan
                  </button>
                </form>
            </div>
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div key="reports" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-200/40">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-bold text-neutral-800 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-[#EAB308]" /> Riwayat Laporan Kejadian
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-neutral-100">
                      <th className="py-4 px-4 text-sm font-bold text-neutral-500 uppercase tracking-wider">Tanggal</th>
                      <th className="py-4 px-4 text-sm font-bold text-neutral-500 uppercase tracking-wider">Kategori</th>
                      <th className="py-4 px-4 text-sm font-bold text-neutral-500 uppercase tracking-wider">Keterangan</th>
                      <th className="py-4 px-4 text-sm font-bold text-neutral-500 uppercase tracking-wider">Bukti Foto</th>
                      <th className="py-4 px-4 text-sm font-bold text-neutral-500 uppercase tracking-wider text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {paginationActivities.currentData.map((item, idx) => (
                      <tr key={item.id + idx} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-4 px-4 text-sm font-bold text-neutral-800 whitespace-nowrap align-top">
                          {new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-4 align-top">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-neutral-600 font-medium min-w-[200px] align-top">
                          <div className="whitespace-pre-wrap">{item.description}</div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          {item.attachment_url ? (
                            <div 
                              className="inline-block rounded-xl overflow-hidden border border-neutral-200 shadow-sm cursor-pointer" 
                              onClick={() => {
                                import('sweetalert2').then(Swal => {
                                  Swal.default.fire({
                                    imageUrl: item.attachment_url,
                                    imageAlt: 'Lampiran Bukti',
                                    showConfirmButton: false,
                                    showCloseButton: true,
                                    width: 'auto',
                                    customClass: { image: 'max-h-[80vh] object-contain rounded-xl' }
                                  });
                                });
                              }}
                            >
                              <img src={item.attachment_url} alt="Lampiran Bukti" className="h-20 w-32 object-cover hover:opacity-80 transition-opacity" />
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-400 italic">Tidak ada bukti</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center align-top">
                          <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {paginationActivities.currentData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-neutral-500 font-medium">Data laporan kejadian tidak ditemukan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination {...paginationActivities} />
            </div>

            <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-200/40">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-bold text-neutral-800 flex items-center gap-3">
                  <Star className="w-6 h-6 text-[#EAB308]" /> Riwayat Penilaian Score Credit
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-neutral-100">
                      <th className="py-4 px-4 text-sm font-bold text-neutral-500 uppercase tracking-wider">Tanggal</th>
                      <th className="py-4 px-4 text-sm font-bold text-neutral-500 uppercase tracking-wider">Alasan</th>
                      <th className="py-4 px-4 text-sm font-bold text-neutral-500 uppercase tracking-wider text-center">Evaluator</th>
                      <th className="py-4 px-4 text-sm font-bold text-neutral-500 uppercase tracking-wider text-center">Skor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {paginationReports.currentData.map((item, idx) => {
                      let evaluatorStr = '-';
                      if (item.evaluatorId) {
                        const rep = users.find(u => u.id === item.evaluatorId);
                        if (rep) {
                          evaluatorStr = `${rep.name} (${rep.role === 'academic' ? 'PA' : 'HR'})`;
                        }
                      }
                      return (
                      <tr key={item.id + idx} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-4 px-4 text-sm font-bold text-neutral-800 whitespace-nowrap align-top">
                          {new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-4 text-sm text-neutral-600 font-medium whitespace-pre-wrap min-w-[250px] align-top">
                          {item.description}
                        </td>
                        <td className="py-4 px-4 text-sm text-neutral-600 text-center align-top whitespace-nowrap">
                          {evaluatorStr}
                        </td>
                        <td className="py-4 px-4 text-center align-top">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
                            {item.impact && (
                              <span className={`text-xs font-bold ${item.impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.impact > 0 ? '+' : ''}{item.impact} Poin
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                      )
                    })}
                    {paginationReports.currentData.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-neutral-500 font-medium">Data penilaian tidak ditemukan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination {...paginationReports} />
            </div>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div key="profile" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
            <div className="mb-8">
              <h3 className="font-bold text-2xl text-neutral-800 mb-2">Profil & Pengaturan</h3>
              <p className="text-neutral-500 font-medium">Perbarui informasi personal dan akademik Anda.</p>
            </div>
            <form onSubmit={handleUpdateProfile} className="bg-white border border-neutral-200 rounded-3xl shadow-xl shadow-neutral-200/30 overflow-hidden">
               <div className="grid grid-cols-1 md:grid-cols-12 gap-0 divide-y md:divide-y-0 md:divide-x divide-neutral-100">
                 
                 {/* Left Column - Personal Info */}
                 <div className="col-span-1 md:col-span-5 p-8 bg-neutral-50/50">
                    <div className="flex flex-col items-center text-center mb-8">
                      <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden relative group mb-4">
                        {profilePhoto ? (
                          <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400 bg-neutral-100">
                            <UserIcon className="w-12 h-12" />
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs font-bold gap-1">
                          <Upload className="w-5 h-5 text-[#EAB308]" />
                          Ubah Foto
                          <input type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoUpload} />
                        </label>
                      </div>
                      <h4 className="font-bold text-lg text-neutral-800">{currentUser.name}</h4>
                      <p className="text-sm font-semibold text-[#EAB308] mb-6">Peserta Magang</p>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Nama Lengkap</label>
                        <input type="text" required value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl outline-none font-medium text-neutral-800 focus:ring-2 focus:ring-[#EAB308] transition-all shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Nama Panggilan</label>
                        <input type="text" value={profileNickname} onChange={(e) => setProfileNickname(e.target.value)} className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl outline-none font-medium text-neutral-800 focus:ring-2 focus:ring-[#EAB308] transition-all shadow-sm" placeholder="Contoh: Budi" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Nomor Telepon</label>
                        <input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl outline-none font-medium text-neutral-800 focus:ring-2 focus:ring-[#EAB308] transition-all shadow-sm" placeholder="+62..." />
                      </div>
                    </div>
                 </div>

                 {/* Right Column - Academic & Security */}
                 <div className="col-span-1 md:col-span-7 p-8">
                    <div className="space-y-8">
                      <div className="space-y-5">
                        <h4 className="font-bold text-neutral-800 flex items-center gap-2 border-b border-neutral-100 pb-2">
                          Data Akademik
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">NIM / NIS</label>
                            <input type="text" value={profileNim} onChange={(e) => setProfileNim(e.target.value)} className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-medium text-neutral-800 focus:bg-white focus:ring-2 focus:ring-[#EAB308] transition-all" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Tim Startup</label>
                            <select value={profileStartup} onChange={(e) => setProfileStartup(e.target.value)} className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-medium text-neutral-800 focus:bg-white focus:ring-2 focus:ring-[#EAB308] transition-all appearance-none cursor-pointer">
                              <option value="">-- Pilih Startup --</option>
                              {startups.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Dosen Pembimbing Akademik</label>
                            <select value={profileLecturer} onChange={(e) => setProfileLecturer(e.target.value)} className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-medium text-neutral-800 focus:bg-white focus:ring-2 focus:ring-[#EAB308] transition-all appearance-none cursor-pointer">
                              <option value="">-- Pilih Dosen --</option>
                              {academics.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <h4 className="font-bold text-neutral-800 flex items-center gap-2 border-b border-neutral-100 pb-2">
                          Keamanan Akun
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Email Login</label>
                            <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-medium text-neutral-800 focus:bg-white focus:ring-2 focus:ring-[#EAB308] transition-all" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Password Baru</label>
                            <input type="password" value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)} className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-medium text-neutral-800 focus:bg-white focus:ring-2 focus:ring-[#EAB308] transition-all" placeholder="Kosongkan jika tidak diubah" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Konfirmasi Password</label>
                            <input type="password" value={profileConfirmPassword} onChange={(e) => setProfileConfirmPassword(e.target.value)} className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-medium text-neutral-800 focus:bg-white focus:ring-2 focus:ring-[#EAB308] transition-all" placeholder="Ketik ulang password baru" />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end border-t border-neutral-100">
                        <button type="submit" className="px-8 py-3.5 bg-[#EAB308] text-black rounded-xl font-bold hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/20 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" /> Simpan Perubahan
                        </button>
                      </div>
                    </div>
                 </div>

               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
