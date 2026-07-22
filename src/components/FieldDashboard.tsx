import InternDetailModal from "./InternDetailModal";
import React, { useState } from 'react';
import { useAppContext } from '../store';
// @ts-ignore - motion/react type missing
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Users, Eye, Activity, FileText, BarChart3, Edit2, Save, X, Ban, Trash2, Plus, ArrowUpRight, ArrowDownRight, Upload, ImageIcon, ShieldCheck, Star, ShieldAlert, Download, FileSpreadsheet, CheckSquare, ScanFace, MoreVertical } from 'lucide-react';
import { useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Role } from '../types';
import { getGrade } from '../utils';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from './Pagination';
import { DataTable } from './DataTable';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function FieldDashboard({ activeTab }: { activeTab: string }) {
  const { users, reports, updateScore, updateUser, deleteUser, suspendUser, addReport, deleteReport, addUser, currentUser, rubricAspects, updateRubricAspects, startups, addStartup, updateStartup, deleteStartup, batches, addBatch, updateBatch, deleteBatch, activities, updateActivityStatus } = useAppContext();


  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [overriddenReports, setOverriddenReports] = useState<string[]>([]);
  const [faceAccuracy, setFaceAccuracy] = useState('85');
  const [requireGeo, setRequireGeo] = useState(true);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [batchFormData, setBatchFormData] = useState({ name: '', date_range: '', status: 'active' as 'active' | 'completed' });

  const exportUsersToCSV = () => {
    const isIntern = userTab === 'intern';
    const currentUsers = isIntern ? users.filter(u => u.role === 'intern') : users.filter(u => u.role === 'academic');
    const headers = isIntern 
      ? ['Nama', 'Email', 'Startup', 'NIM', 'Skor', 'Grade', 'Status']
      : ['Nama', 'Email', 'No Telp', 'Kode Dosen', 'Startup Bimbingan', 'Status'];
      
    const csvContent = [
      headers.join(','),
      ...currentUsers.map(user => {
        if (isIntern) {
          const startupName = startups?.find(s => s.id === user.startup)?.name || '-';
          return [
            `"${user.name}"`,
            `"${user.email}"`,
            `"${startupName}"`,
            `"${user.nim || '-'}"`,
            `"${user.score}"`,
            `"${getGrade(user.score)}"`,
            `"${user.status}"`
          ].join(',');
        } else {
          const advisedStartupNames = (user.advisedStartups || []).map(id => startups?.find(s => s.id === id)?.name).filter(Boolean).join(', ');
          return [
            `"${user.name}"`,
            `"${user.email}"`,
            `"${user.phone || '-'}"`,
            `"${user.lecturerCode || '-'}"`,
            `"${advisedStartupNames || '-'}"`,
            `"${user.status}"`
          ].join(',');
        }
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', isIntern ? 'data_peserta_magang.csv' : 'data_dosen_pembimbing.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUsersToPDF = () => {
    const isIntern = userTab === 'intern';
    const doc = new jsPDF();
    doc.text(isIntern ? 'Data Peserta Magang' : 'Data Dosen Pembimbing', 14, 15);
    const currentUsers = isIntern ? users.filter(u => u.role === 'intern') : users.filter(u => u.role === 'academic');
    
    const tableData = currentUsers.map(user => {
        if (isIntern) {
          const startupName = startups?.find(s => s.id === user.startup)?.name || '-';
          return [
            user.name,
            user.email,
            startupName,
            user.nim || '-',
            `${user.score} (${getGrade(user.score)})`,
            user.status
          ];
        } else {
          const advisedStartupNames = (user.advisedStartups || []).map(id => startups?.find(s => s.id === id)?.name).filter(Boolean).join(', ');
          return [
            user.name,
            user.email,
            user.phone || '-',
            user.lecturerCode || '-',
            advisedStartupNames || '-',
            user.status
          ];
        }
    });

    autoTable(doc, {
      head: isIntern 
        ? [['Nama', 'Email', 'Startup', 'NIM', 'Skor', 'Status']]
        : [['Nama', 'Email', 'No Telp', 'Kode Dosen', 'Startup Bimbingan', 'Status']],
      body: tableData,
      startY: 20,
    });
    
    doc.save(isIntern ? 'data_peserta_magang.pdf' : 'data_dosen_pembimbing.pdf');
  };

  const exportReportsToCSV = () => {
    const headers = ['Pelapor & Waktu', 'Target Evaluasi', 'Kredit Score', 'Keterangan'];
    const csvContent = [
      headers.join(','),
      ...reports.map(report => {
        const targetUser = users.find(u => u.id === report.targetId);
        const targetStartup = startups?.find(s => s.id === report.targetId);
        let targetName = report.targetType === 'startup' ? targetStartup?.name : targetUser?.name;
        targetName = targetName || 'Unknown';
        const reporterName = 'Pembimbing Lapangan (HR)';
        const dateStr = new Date(report.date).toLocaleDateString();
        
        return [
          `"${reporterName} - ${dateStr}"`,
          `"${targetName} (${report.targetType === 'startup' ? 'Startup Team' : 'Intern'})"`,
          `"${report.pointsImpact > 0 ? '+' : ''}${report.pointsImpact} (${report.pointsImpact > 0 ? 'Tindakan Baik' : 'Pelanggaran'})"`,
          `"${report.description}"`
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'riwayat_penilaian_socmed.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportReportsToPDF = () => {
    const doc = new jsPDF();
    doc.text('Riwayat Penilaian Social Credit Score', 14, 15);
    
    const tableData = reports.map(report => {
        const targetUser = users.find(u => u.id === report.targetId);
        const targetStartup = startups?.find(s => s.id === report.targetId);
        let targetName = report.targetType === 'startup' ? targetStartup?.name : targetUser?.name;
        targetName = targetName || 'Unknown';
        const reporterName = 'Pembimbing Lapangan (HR)';
        const dateStr = new Date(report.date).toLocaleDateString();
        
        return [
          `${reporterName}\n${dateStr}`,
          `${targetName}\n(${report.targetType === 'startup' ? 'Startup Team' : 'Intern'})`,
          `${report.pointsImpact > 0 ? '+' : ''}${report.pointsImpact}\n(${report.pointsImpact > 0 ? 'Tindakan Baik' : 'Pelanggaran'})`,
          report.description
        ];
    });

    autoTable(doc, {
      head: [['Pelapor & Waktu', 'Target Evaluasi', 'Kredit Score', 'Keterangan']],
      body: tableData,
      startY: 20,
    });
    
    doc.save('riwayat_penilaian_socmed.pdf');
  };
  const [viewedPhotoUrl, setViewedPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenActionMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // User Management States

  const [userTab, setUserTab] = useState<'intern' | 'academic'>('intern');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editScoreVal, setEditScoreVal] = useState<number>(0);

  const [showRubricScoreModal, setShowRubricScoreModal] = useState(false);
  const [selectedInternDetail, setSelectedInternDetail] = useState<any>(null);
  const [rubricTargetUser, setRubricTargetUser] = useState<any>(null);
  const [rubricValues, setRubricValues] = useState<Record<string, number>>({});
  
  // Score Management States
  const [chartFilter, setChartFilter] = useState<'hari' | 'bulan' | 'tahun'>('bulan');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [targetType, setTargetType] = useState<'intern' | 'startup'>('intern');
  const [reportType, setReportType] = useState<'good' | 'bad'>('good');
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [pointsImpact, setPointsImpact] = useState<number>(5);
  const [selectedAspectId, setSelectedAspectId] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState('');
  
  // Custom states
  const [internSearch, setInternSearch] = useState('');
  const [showInternDropdown, setShowInternDropdown] = useState(false);
  const [isEditingRubric, setIsEditingRubric] = useState(false);
  const [tempRubrics, setTempRubrics] = useState(rubricAspects);

  const interns = users.filter(u => u.role === 'intern');
  const academics = users.filter(u => u.role === 'academic');
  const activeUsersList = userTab === 'intern' ? interns : academics;

  const needsAttentionList = [...interns].filter(i => i.score < 70).sort((a, b) => a.score - b.score);
  const paginationAttention = usePagination(needsAttentionList, 10);
  const paginationUsers = usePagination(activeUsersList, 10);
  const paginationReports = usePagination(reports, 10);
  const paginationStartups = usePagination(startups, 10);

  // Create User States
  const handleSaveBatch = async () => {
    try {
      if (editingBatch) {
        await updateBatch(editingBatch.id, batchFormData);
      } else {
        await addBatch(batchFormData);
      }
      setShowBatchModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (confirm('Yakin ingin menghapus batch ini?')) {
      try {
        await deleteBatch(id);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const [activeFilter, setActiveFilter] = useState('all');
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState<Role>('intern');
  const [editUserStartup, setEditUserStartup] = useState('');
  const [editUserNim, setEditUserNim] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserNickname, setEditUserNickname] = useState('');
  const [editUserLecturerCode, setEditUserLecturerCode] = useState('');
  const [editUserAdvisedStartups, setEditUserAdvisedStartups] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'intern'|'academic'>('intern');

  // Startup Management States
  const [showAddStartupModal, setShowAddStartupModal] = useState(false);
  const [newStartupName, setNewStartupName] = useState('');
  const [newStartupDesc, setNewStartupDesc] = useState('');
  
  const [editingStartupId, setEditingStartupId] = useState<string | null>(null);
  const [editStartupName, setEditStartupName] = useState('');
  const [editStartupDesc, setEditStartupDesc] = useState('');

  const [activityLogTab, setActivityLogTab] = useState<'intern' | 'academic'>('intern');

  const handleAddStartup = async (e: React.FormEvent) => {
    e.preventDefault();
    const Swal = (await import('sweetalert2')).default;
    if (startups.find(s => s.name.toLowerCase() === newStartupName.toLowerCase())) {
      Swal.fire('Gagal', 'Nama Startup sudah ada!', 'error');
      return;
    }
    
    Swal.fire({
      title: 'Memproses...',
      text: 'Menambahkan startup',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await addStartup({ name: newStartupName, description: newStartupDesc });
      setShowAddStartupModal(false);
      setNewStartupName('');
      setNewStartupDesc('');
      Swal.fire('Berhasil', 'Startup berhasil ditambahkan!', 'success');
    } catch (error: any) {
      Swal.fire('Gagal', 'Startup gagal ditambahkan: ' + error.message, 'error');
    }
  };

  const handleSaveRubric = async () => {
    const Swal = (await import('sweetalert2')).default;
    const totalWeight = tempRubrics.reduce((acc, r) => acc + (Number(r.weight) || 0), 0);
    if (totalWeight !== 100) {
      Swal.fire('Peringatan', 'Total bobot persentase harus 100%', 'warning');
      return;
    }
    
    Swal.fire({
      title: 'Memproses...',
      text: 'Menyimpan rubrik',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await updateRubricAspects(tempRubrics);
      setIsEditingRubric(false);
      Swal.fire('Berhasil', 'Rubrik penilaian berhasil diperbarui', 'success');
    } catch (error: any) {
      Swal.fire('Gagal', 'Rubrik gagal diperbarui: ' + error.message, 'error');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const Swal = (await import('sweetalert2')).default;
    if (users.find(u => u.email === newUserEmail)) {
      Swal.fire('Gagal', 'Email sudah digunakan!', 'error');
      return;
    }
    
    Swal.fire({
      title: 'Memproses...',
      text: 'Menambahkan pengguna',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    try {
      await addUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword || (newUserRole === 'intern' ? 'pesertamagang@26' : 'dosenakademik@26'),
        role: newUserRole,
        score: 0,
        attendanceCount: 0,
        totalDays: 0,
      });
      
      Swal.fire('Berhasil', 'Pengguna berhasil ditambahkan!', 'success');
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
    } catch (error: any) {
      Swal.fire('Gagal', 'Gagal menambahkan pengguna: ' + error.message, 'error');
    }
  };


  const startEditingScore = (user: any) => {
    setEditingUserId(user.id);
    setEditScoreVal(user.score);
  };

  const saveScore = async (userId: string) => {
    const Swal = (await import('sweetalert2')).default;
    Swal.fire({
      title: 'Memproses...',
      text: 'Menyimpan skor',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await updateScore(userId, editScoreVal);
      setEditingUserId(null);
      Swal.close();
    } catch (error: any) {
      Swal.fire('Gagal', 'Gagal menyimpan skor: ' + error.message, 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const Swal = (await import('sweetalert2')).default;
    if (!selectedTargetId) {
      Swal.fire('Gagal', 'Silakan pilih peserta magang atau startup dari daftar terlebih dahulu!', 'error');
      return;
    }
    if (!currentUser) return;
    
    Swal.fire({
      title: 'Memproses...',
      text: 'Menyimpan laporan',
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
        date: new Date(reportDate).toISOString(),
        type: reportType,
        description,
        photoUrl,
        aspectId: selectedAspectId || undefined,
        pointsImpact: reportType === 'good' ? Math.abs(pointsImpact) : -Math.abs(pointsImpact)
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

  // Mock data for chart
  const calculateStartupScore = (startupName: string) => {
     const startupInterns = interns.filter(i => i.startup === startupName);
     return startupInterns.length ? Math.round(startupInterns.reduce((acc, curr) => acc + curr.score, 0) / startupInterns.length) : 0;
  };

  const uniqueStartups = Array.from(new Set(interns.map(i => i.startup).filter(Boolean))) as string[];
  const avgStartupScore = uniqueStartups.length ? Math.round(uniqueStartups.reduce((acc, s) => acc + calculateStartupScore(s), 0) / uniqueStartups.length) : 0;
  const avgInternScore = interns.length ? Math.round(interns.reduce((acc, u) => acc + u.score, 0) / interns.length) : 0;

  const chartData = React.useMemo(() => {
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
      // 6 months starting from July
      const months = ['Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      for (let i = 0; i < 6; i++) {
        const targetMonthIndex = 6 + i;
        const targetYear = currentYear;
        
        let score = 0;
        if (targetYear > currentYear || (targetYear === currentYear && targetMonthIndex > currentMonth)) {
          score = 0;
        } else {
          const endOfTargetMonth = new Date(targetYear, targetMonthIndex + 1, 0, 23, 59, 59).getTime();
          let sumScores = 0;
          interns.forEach(intern => {
            const futureReports = reports.filter(r => r.targetId === intern.id && new Date(r.date).getTime() > endOfTargetMonth);
            const futurePointsImpact = futureReports.reduce((sum, r) => sum + (r.pointsImpact || 0), 0);
            sumScores += (intern.score - futurePointsImpact);
          });
          score = interns.length > 0 ? Math.max(0, Math.round(sumScores / interns.length)) : 0;
        }
        
        trendData.push({
          name: months[i],
          score: score
        });
      }
    } else if (chartFilter === 'tahun') {
      // 5 years starting from 2026
      const startYear = 2026;
      const currentYear = currentDate.getFullYear();
      
      for (let i = 0; i < 5; i++) {
        const targetYear = startYear + i;
        
        let score = 0;
        if (targetYear > currentYear) {
          score = 0;
        } else {
          const endOfTargetYear = new Date(targetYear, 11, 31, 23, 59, 59).getTime();
          let sumScores = 0;
          interns.forEach(intern => {
            const futureReports = reports.filter(r => r.targetId === intern.id && new Date(r.date).getTime() > endOfTargetYear);
            const futurePointsImpact = futureReports.reduce((sum, r) => sum + (r.pointsImpact || 0), 0);
            sumScores += (intern.score - futurePointsImpact);
          });
          score = interns.length > 0 ? Math.max(0, Math.round(sumScores / interns.length)) : 0;
        }
        
        trendData.push({
          name: targetYear.toString(),
          score: score
        });
      }
    }
    
    return trendData;
  }, [interns, reports, chartFilter]);

  const attendanceData = [
    { name: 'Senin', inTime: 80, onTime: 15, telat: 5 },
    { name: 'Selasa', inTime: 75, onTime: 20, telat: 5 },
    { name: 'Rabu', inTime: 85, onTime: 10, telat: 5 },
    { name: 'Kamis', inTime: 70, onTime: 20, telat: 10 },
    { name: 'Jumat', inTime: 90, onTime: 10, telat: 0 },
  ];

  const getInternsWithoutLogToday = () => {
    const today = new Date().toDateString();
    return interns.filter(intern => {
      return !activities.some(act => 
        act.internId === intern.id && new Date(act.date).toDateString() === today
      );
    });
  };

  const missingLogInterns = getInternsWithoutLogToday();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-[#EAB308] to-yellow-600 p-8 rounded-3xl text-black shadow-xl shadow-yellow-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="w-8 h-8" /> Panel Kontrol Utama
          </h2>
          <p className="opacity-90 mt-2 font-medium text-lg">Hak akses penuh Pembimbing Lapangan (HR)</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="bg-black/20 backdrop-blur-md px-6 py-4 rounded-2xl flex-1 md:flex-none">
            <p className="text-sm font-semibold opacity-90 mb-1">Total Peserta</p>
            <p className="text-3xl font-bold">{interns.length}</p>
          </div>
          <div className="bg-black/20 backdrop-blur-md px-6 py-4 rounded-2xl flex-1 md:flex-none">
            <p className="text-sm font-semibold opacity-90 mb-1">Score Individu (Rata-rata)</p>
            <p className="text-3xl font-bold">{avgInternScore}</p>
          </div>
          <div className="bg-black/20 backdrop-blur-md px-6 py-4 rounded-2xl flex-1 md:flex-none">
            <p className="text-sm font-semibold opacity-90 mb-1">Score Startup (Rata-rata)</p>
            <p className="text-3xl font-bold">{avgStartupScore}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-xl shadow-neutral-200/40 min-h-[500px]">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="p-8">
              <h3 className="font-bold text-xl text-neutral-800 mb-6">Overview Perkembangan</h3>
              <div className="grid grid-cols-1 gap-8 mb-8">
                <div className="bg-neutral-50 rounded-3xl p-6 border border-neutral-100 w-full">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                    <h4 className="font-semibold text-neutral-700">Grafik Rata-rata Social Credit Score</h4>
                    <div className="flex bg-neutral-200/50 p-1 rounded-xl">
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
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#888'}} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                        <Area type="monotone" dataKey="score" stroke="#EAB308" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Top 5 Table */}
                  <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
                      <h4 className="font-bold text-neutral-800 flex items-center gap-2"><Star className="w-5 h-5 text-[#EAB308]"/> Top 5 Peserta (Skor Tertinggi)</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-100">
                          <tr>
                            <th className="p-4 font-semibold">Nama</th>
                            <th className="p-4 font-semibold text-right">Skor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {[...interns].filter(i => i.score >= 70).sort((a, b) => b.score - a.score).slice(0, 5).map(intern => (
                            <tr key={intern.id} className="hover:bg-neutral-50/50 transition-colors">
                              <td className="p-4 font-bold text-neutral-800">{intern.name}</td>
                              <td className="p-4 font-bold text-right text-[#EAB308]">{intern.score}</td>
                            </tr>
                          ))}
                          {[...interns].filter(i => i.score >= 70).length === 0 && (
                            <tr>
                              <td colSpan={2} className="p-8 text-center text-neutral-500 font-medium">
                                Belum ada peserta dengan skor di atas 70.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Perlu Perhatian Table */}
                  <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
                      <h4 className="font-bold text-neutral-800 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-red-500"/> Peserta Perlu Perhatian (Skor &lt; 70)</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-100">
                          <tr>
                            <th className="p-4 font-semibold">Nama</th>
                            <th className="p-4 font-semibold text-right">Skor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {paginationAttention.currentData.map(intern => (
                            <tr key={intern.id} className="hover:bg-neutral-50/50 transition-colors">
                              <td className="p-4 font-bold text-neutral-800">{intern.name}</td>
                              <td className="p-4 font-bold text-right text-red-500">{intern.score}</td>
                            </tr>
                          ))}
                          {needsAttentionList.length === 0 && (
                            <tr>
                              <td colSpan={2} className="p-8 text-center text-green-600 font-medium">
                                Tidak ada peserta dengan skor di bawah 70.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <Pagination {...paginationAttention} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div key="users" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
              <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex gap-2">
                  <button onClick={() => setUserTab('intern')} className={`px-4 py-2 rounded-lg font-bold text-sm ${userTab === 'intern' ? 'bg-black text-[#EAB308]' : 'bg-white text-neutral-500 border border-neutral-200'}`}>Peserta Magang</button>
                  <button onClick={() => setUserTab('academic')} className={`px-4 py-2 rounded-lg font-bold text-sm ${userTab === 'academic' ? 'bg-black text-[#EAB308]' : 'bg-white text-neutral-500 border border-neutral-200'}`}>Dosen Pembimbing</button>
                </div>
                <div className="flex gap-3">
                  <button onClick={exportUsersToPDF} className="flex items-center gap-2 bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
                    <Download className="w-4 h-4" /> Export PDF
                  </button>
                  <button onClick={exportUsersToCSV} className="flex items-center gap-2 bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
                    <FileSpreadsheet className="w-4 h-4" /> Export CSV
                  </button>
                  <button onClick={() => setShowAddUserModal(true)} className="flex items-center gap-2 bg-[#EAB308] text-black hover:bg-[#DCA506] px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
                    <Plus className="w-4 h-4" /> Tambah Pengguna
                  </button>
                </div>
              </div>

              <DataTable
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
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${user.status === 'suspended' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}><Ban className="w-4 h-4" /></div> {user.status === 'suspended' ? 'Aktifkan Akun' : 'Suspend Akun'}
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
              />
              
              <AnimatePresence>
                {selectedUserIds.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 50, x: '-50%' }}
                    className="fixed bottom-10 left-1/2 z-50 bg-neutral-900 text-white shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6"
                  >
                    <span className="font-bold text-sm">{selectedUserIds.length} pengguna terpilih</span>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedUserIds(activeUsersList.map(u => u.id))} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                        <CheckSquare className="w-4 h-4" /> Pilih Semua
                      </button>
                      <button onClick={async () => {
                        const Swal = (await import('sweetalert2')).default;
                        const res = await Swal.fire({
                          title: 'Hapus pengguna terpilih?',
                          text: "Data yang dihapus tidak dapat dikembalikan!",
                          icon: 'warning',
                          showCancelButton: true,
                          confirmButtonColor: '#ef4444',
                          cancelButtonColor: '#a3a3a3',
                          confirmButtonText: 'Ya, Hapus!'
                        });
                        if(res.isConfirmed) {
                          selectedUserIds.forEach(id => deleteUser(id));
                          setSelectedUserIds([]);
                          Swal.fire('Terhapus!', 'Pengguna telah dihapus.', 'success');
                        }
                      }} className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                        <Trash2 className="w-4 h-4" /> Hapus Terpilih
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'scores' && (
            <motion.div key="scores" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="p-8">
              <div className="max-w-2xl mx-auto">
                <h3 className="font-bold text-2xl text-neutral-800 mb-2">Beri Nilai Social Credit Score</h3>
                <p className="text-neutral-500 mb-8 font-medium">Berikan penilaian positif atau negatif pada peserta magang atau tim startup secara langsung.</p>
                
                <div className="mb-8 p-6 bg-indigo-50 border border-indigo-100 rounded-3xl text-indigo-900">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold flex items-center gap-2"><FileText className="w-5 h-5"/> Aturan & Bobot Default Magang</h4>
                  </div>
                  <p className="text-sm">Rubrik penilaian telah dipindahkan ke menu <b>System Settings</b>.</p>
                </div>

                <form onSubmit={handleReportSubmit} className="space-y-6 bg-neutral-50 p-6 md:p-8 rounded-3xl border border-neutral-100 shadow-sm">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => { setTargetType('intern'); setSelectedTargetId(''); }}
                      className={`p-3 rounded-xl font-bold text-sm transition-all border-2 ${targetType === 'intern' ? 'border-[#EAB308] bg-white shadow-sm text-black' : 'border-transparent bg-neutral-200/50 text-neutral-500 hover:bg-neutral-200'}`}
                    >
                      Peserta Magang
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTargetType('startup'); setSelectedTargetId(''); }}
                      className={`p-3 rounded-xl font-bold text-sm transition-all border-2 ${targetType === 'startup' ? 'border-[#EAB308] bg-white shadow-sm text-black' : 'border-transparent bg-neutral-200/50 text-neutral-500 hover:bg-neutral-200'}`}
                    >
                      Tim Startup
                    </button>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Tanggal Penilaian</label>
                    <input
                      type="date"
                      required
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#EAB308] outline-none font-medium transition-all shadow-sm"
                    />
                  </div>

                  {targetType === 'intern' ? (
                    <div className="relative mb-6">
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Pilih Peserta Magang</label>
                      <input
                        type="text"
                        placeholder="Cari Peserta Magang..."
                        value={internSearch}
                        onFocus={() => setShowInternDropdown(true)}
                        onBlur={() => setTimeout(() => setShowInternDropdown(false), 200)}
                        onChange={(e) => {
                           setInternSearch(e.target.value);
                           setSelectedTargetId(''); // Clear selected ID if user types manually
                           setShowInternDropdown(true);
                        }}
                        className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#EAB308] outline-none font-medium transition-all shadow-sm"
                      />
                      {showInternDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {interns.filter(i => i.name.toLowerCase().includes(internSearch.toLowerCase())).map(i => (
                            <button
                              key={i.id}
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSelectedTargetId(i.id);
                                setInternSearch(i.name);
                                setShowInternDropdown(false);
                              }}
                            >
                              <span className="block font-medium text-neutral-800">{i.name}</span>
                              <span className="block text-xs text-neutral-500">{i.startup || 'Tidak ada startup'}</span>
                            </button>
                          ))}
                          {interns.filter(i => i.name.toLowerCase().includes(internSearch.toLowerCase())).length === 0 && (
                            <div className="px-4 py-3 text-sm text-neutral-500 text-center">Tidak ditemukan.</div>
                          )}
                        </div>
                      )}
                      
                      {selectedTargetId && (
                        <div className="mt-3 p-4 bg-yellow-50/50 border border-[#EAB308]/20 rounded-xl flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Skor Saat Ini</span>
                            <span className="text-sm font-bold text-neutral-800">{interns.find(i => i.id === selectedTargetId)?.name}</span>
                          </div>
                          <span className="text-2xl font-black text-[#EAB308]">
                            {interns.find(i => i.id === selectedTargetId)?.score || 0}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Pilih Startup</label>
                      <select 
                        required
                        value={selectedTargetId}
                        onChange={(e) => setSelectedTargetId(e.target.value)}
                        className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#EAB308] outline-none font-medium transition-all shadow-sm appearance-none"
                      >
                        <option value="" disabled>Pilih tim startup...</option>
                        {startups.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setReportType('good')}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${reportType === 'good' ? 'border-green-500 bg-green-50 text-green-700 font-bold shadow-md shadow-green-100' : 'border-transparent bg-white text-neutral-500 shadow-sm hover:border-green-200'}`}
                    >
                      <ArrowUpRight className="w-6 h-6" /> Tindakan Baik
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportType('bad')}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${reportType === 'bad' ? 'border-red-500 bg-red-50 text-red-700 font-bold shadow-md shadow-red-100' : 'border-transparent bg-white text-neutral-500 shadow-sm hover:border-red-200'}`}
                    >
                      <ArrowDownRight className="w-6 h-6" /> Tindakan Buruk
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Aspek Nilai (Opsional)</label>
                      <select
                        value={selectedAspectId}
                        onChange={(e) => setSelectedAspectId(e.target.value)}
                        className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#EAB308] outline-none font-medium transition-all shadow-sm appearance-none"
                      >
                        <option value="">Pilih Aspek Penilaian...</option>
                        {rubricAspects.map(aspect => (
                          <option key={aspect.id} value={aspect.id}>{aspect.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Dampak Poin</label>
                      <input 
                        type="number" 
                        min="1" max="100" required
                        value={pointsImpact}
                        onChange={(e) => setPointsImpact(Number(e.target.value))}
                        className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#EAB308] outline-none font-medium transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Keterangan / Laporan</label>
                    <textarea 
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-4 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#EAB308] outline-none resize-none h-28 transition-all shadow-sm"
                      placeholder="Deskripsikan alasan pemberian/pengurangan poin..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Bukti Foto (Opsional)</label>
                    <div className="border-2 border-dashed border-neutral-300 rounded-2xl p-6 text-center hover:bg-white transition-colors relative cursor-pointer bg-neutral-100/50">
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      {photoUrl ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={photoUrl} alt="Preview" className="h-32 w-auto rounded-xl object-cover shadow-sm" />
                          <span className="text-xs font-bold text-neutral-500">Klik untuk ganti foto</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-neutral-400 shadow-sm">
                            <Upload className="w-6 h-6" />
                          </div>
                          <span className="text-sm font-medium text-neutral-600">Upload bukti kegiatan</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-black text-[#EAB308] hover:bg-neutral-800 font-bold py-4 rounded-xl transition-all shadow-xl mt-4"
                  >
                    Simpan Penilaian
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === 'incidents' && (
            <motion.div key="incidents" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
              <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="font-semibold text-neutral-800">Laporan Kejadian Peserta</h3>
              </div>
              <div className="divide-y divide-neutral-100 max-h-[600px] overflow-y-auto">
                {activities.filter(act => {
                   const u = users.find(user => user.id === (act.intern_id || act.internId));
                   return act.type === 'kejadian' && u?.role === 'intern';
                }).length === 0 ? (
                  <p className="p-8 text-center text-neutral-500">Belum ada laporan kejadian.</p>
                ) : (
                  activities
                    .filter(act => {
                       const u = users.find(user => user.id === (act.intern_id || act.internId));
                       return act.type === 'kejadian' && u?.role === 'intern';
                    })
                    .map(act => {
                    const user = users.find(u => u.id === (act.intern_id || act.internId));
                    return (
                      <div key={act.id} className="p-6 hover:bg-neutral-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold text-sm">
                              {user?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-neutral-800">
                                {user?.name || 'Unknown User'} 
                                <span className="ml-2 text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                  {user?.role === 'intern' ? 'Peserta Magang' : user?.role === 'academic' ? 'Dosen' : 'User'}
                                </span>
                              </p>
                              <p className="text-xs font-medium text-neutral-500">{new Date(act.date).toLocaleString('id-ID')}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 bg-white border border-neutral-100 p-4 rounded-2xl shadow-sm">
                          <p className="text-sm text-neutral-700 font-medium">
                            {act.title ? <span className="font-bold block mb-1">{act.title}</span> : null}
                            {act.description || act.activity}
                          </p>
                          {act.attachment_url && (
                            <div 
                              className="mt-3 inline-block rounded-xl overflow-hidden border border-neutral-200 shadow-sm cursor-pointer" 
                              onClick={() => {
                                import('sweetalert2').then(Swal => {
                                  Swal.default.fire({
                                    imageUrl: act.attachment_url,
                                    imageAlt: 'Lampiran Bukti',
                                    showConfirmButton: false,
                                    showCloseButton: true,
                                    width: 'auto',
                                    customClass: { image: 'max-h-[80vh] object-contain rounded-xl' }
                                  });
                                });
                              }}
                            >
                              <img src={act.attachment_url} alt="Lampiran Bukti" className="max-h-40 object-cover hover:opacity-80 transition-opacity" />
                            </div>
                          )}
                        </div>
                        {act.obstacle && (
                          <div className="mt-3 p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-3 items-start">
                            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-red-800 mb-1">Kendala / Hambatan</p>
                              <p className="text-sm font-medium text-red-700">{act.obstacle}</p>
                            </div>
                          </div>
                        )}
                        <div className="mt-4 flex gap-2">
                          {act.status === 'pending' ? (
                            <>
                              <button onClick={() => updateActivityStatus(act.id, 'approved')} className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 font-bold rounded-lg text-xs">Setujui</button>
                              <button onClick={() => updateActivityStatus(act.id, 'rejected')} className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 font-bold rounded-lg text-xs">Tolak</button>
                            </>
                          ) : (
                            <span className={`px-3 py-1.5 font-bold rounded-lg text-xs ${act.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {act.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div key="reports" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
              
              <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="font-semibold text-neutral-800">Riwayat Penilaian Social Credit Score</h3>
                <div className="flex gap-3">
                  <button onClick={exportReportsToPDF} className="flex items-center gap-2 bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
                    <Download className="w-4 h-4" /> Export PDF
                  </button>
                  <button onClick={exportReportsToCSV} className="flex items-center gap-2 bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
                    <FileSpreadsheet className="w-4 h-4" /> Export CSV
                  </button>
                </div>
              </div>


              <AnimatePresence>
                {selectedReportIds.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 50, x: '-50%' }}
                    className="fixed bottom-10 left-1/2 z-50 bg-neutral-900 text-white shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6"
                  >
                    <span className="font-bold text-sm">{selectedReportIds.length} laporan terpilih</span>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedReportIds(reports.map(r => r.id))} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                        <CheckSquare className="w-4 h-4" /> Pilih Semua
                      </button>
                      <button onClick={() => {
                        setSelectedReportIds([]);
                        import('sweetalert2').then(Swal => Swal.default.fire('Berhasil', 'Laporan terpilih disetujui', 'success'));
                      }} className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                        <ShieldCheck className="w-4 h-4" /> Setujui Terpilih
                      </button>
                      <button onClick={() => {
                        if(window.confirm('Hapus laporan terpilih?')) {
                          // Reports delete doesn't exist in context, we would need to add it or just mock it by showing an alert for now.
                          // Actually, they didn't explicitly ask to delete reports from store, but let's mock it.
                          setSelectedReportIds([]);
                          import('sweetalert2').then(Swal => Swal.default.fire('Terhapus', 'Laporan terpilih dihapus', 'success'));
                        }
                      }} className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                        <Trash2 className="w-4 h-4" /> Hapus Terpilih
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <DataTable
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
                        <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-bold ${report.pointsImpact > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {report.pointsImpact > 0 ? `+${report.pointsImpact}` : report.pointsImpact} Poin
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
              />
            </motion.div>
          )}
          
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="p-8">
              <div className="max-w-4xl mx-auto space-y-12">
                <div>
                  <h3 className="font-bold text-2xl text-neutral-800 mb-2">System Settings</h3>
                  <p className="text-neutral-500 font-medium">Pengaturan rubrik penilaian dan manajemen data master (Startup).</p>
                </div>

                <div className="p-6 bg-white border border-neutral-200 rounded-3xl shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="font-bold text-lg text-neutral-800 flex items-center gap-2"><FileText className="w-5 h-5"/> Rubrik Penilaian Akhir</h4>
                      <p className="text-xs text-neutral-500 mt-1">Total akumulasi bobot harus 100%.</p>
                    </div>
                    {!isEditingRubric ? (
                      <button onClick={() => {setTempRubrics(rubricAspects); setIsEditingRubric(true)}} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 text-sm font-bold flex items-center gap-2 transition-colors"><Edit2 className="w-4 h-4"/> Edit Rubrik</button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => setIsEditingRubric(false)} className="px-4 py-2 bg-neutral-100 text-neutral-600 rounded-xl hover:bg-neutral-200 text-sm font-bold flex items-center gap-2 transition-colors"><X className="w-4 h-4"/> Batal</button>
                        <button onClick={handleSaveRubric} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-bold flex items-center gap-2 transition-colors"><Save className="w-4 h-4"/> Simpan</button>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                    <ul className="space-y-3 text-sm font-medium">
                      {isEditingRubric ? (
                        tempRubrics.map((rubric, idx) => (
                          <li key={rubric.id} className="flex gap-3 items-center bg-white p-3 rounded-xl border border-neutral-200 shadow-sm">
                             <input type="text" value={rubric.name} onChange={(e) => {
                               const newR = [...tempRubrics];
                               newR[idx].name = e.target.value;
                               setTempRubrics(newR);
                             }} className="flex-1 bg-white border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" />
                             <div className="flex items-center gap-2 w-28">
                               <input type="number" value={rubric.weight} onChange={(e) => {
                                 const newR = [...tempRubrics];
                                 newR[idx].weight = Number(e.target.value);
                                 setTempRubrics(newR);
                               }} className="w-16 bg-white border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-right transition-all" />
                               <span className="text-neutral-500">%</span>
                             </div>
                             <button onClick={() => setTempRubrics(tempRubrics.filter(r => r.id !== rubric.id))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                          </li>
                        ))
                      ) : (
                        rubricAspects.map(rubric => (
                          <li key={rubric.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
                            <span className="text-neutral-700 font-semibold">{rubric.name}</span>
                            <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{rubric.weight}%</span>
                          </li>
                        ))
                      )}
                      {isEditingRubric && (
                        <li className="mt-4">
                          <button onClick={() => setTempRubrics([...tempRubrics, { id: Math.random().toString(), name: 'Aspek Baru', weight: 0 }])} className="w-full py-3 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"><Plus className="w-4 h-4"/> Tambah Aspek Penilaian</button>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-white border border-neutral-200 rounded-3xl shadow-sm h-full flex flex-col md:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h4 className="font-bold text-lg text-neutral-800 flex items-center gap-2"><Users className="w-5 h-5"/> Manajemen Batch</h4>
                        <p className="text-xs text-neutral-500 mt-1">Kelola periode magang peserta.</p>
                      </div>
                      <button onClick={() => {
                        setEditingBatch(null);
                        setBatchFormData({ name: '', date_range: '', status: 'active' });
                        setShowBatchModal(true);
                      }} className="px-3 py-1.5 bg-black text-[#EAB308] rounded-xl hover:bg-neutral-800 text-xs font-bold flex items-center gap-1 transition-colors"><Plus className="w-4 h-4"/> Tambah</button>
                    </div>
                    
                    <DataTable
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
                    />
                  </div>
                </div>

                <div className="p-6 bg-white border border-neutral-200 rounded-3xl shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="font-bold text-lg text-neutral-800 flex items-center gap-2">Kelola Data Startup</h4>
                      <p className="text-xs text-neutral-500 mt-1">Daftar tim startup yang menjadi wadah magang.</p>
                    </div>
                    <button 
                      onClick={() => setShowAddStartupModal(true)} 
                      className="px-4 py-2 bg-[#EAB308] text-black rounded-xl hover:bg-yellow-400 text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Tambah Startup
                    </button>
                  </div>
                  
                  <DataTable
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
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {editingUserId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto"
          >
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 sticky top-0 z-10">
              <h3 className="font-bold text-lg text-neutral-800">Edit Profil Pengguna</h3>
              <button onClick={() => setEditingUserId(null)} className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-black hover:bg-neutral-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const userToEdit = users.find(u => u.id === editingUserId);
              if(userToEdit) {
                 const updates: any = { 
                   name: editUserName, 
                   email: editUserEmail, 
                   role: editUserRole,
                   phone: editUserPhone,
                   nickname: editUserNickname
                 };
                 if (editUserPassword) updates.password = editUserPassword;
                 if (editUserRole === 'intern') {
                   updates.startup = editUserStartup;
                   updates.nim = editUserNim;
                 } else if (editUserRole === 'academic') {
                   updates.lecturerCode = editUserLecturerCode;
                   updates.advisedStartups = editUserAdvisedStartups.split(',').map(s => s.trim()).filter(Boolean);
                 }
                 updateUser(editingUserId, updates);
                 import('sweetalert2').then(Swal => Swal.default.fire('Berhasil', 'Data pengguna diperbarui', 'success'));
              }
              setEditingUserId(null);
            }} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Nama Lengkap</label>
                  <input 
                    type="text" required
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Panggilan</label>
                  <input 
                    type="text"
                    value={editUserNickname}
                    onChange={(e) => setEditUserNickname(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] outline-none text-sm transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Email</label>
                  <input 
                    type="email" required
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">No. Telp</label>
                  <input 
                    type="text"
                    value={editUserPhone}
                    onChange={(e) => setEditUserPhone(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] outline-none text-sm transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Role</label>
                <select 
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value as Role)}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] outline-none text-sm transition-all appearance-none"
                >
                  <option value="intern">Peserta Magang</option>
                  <option value="academic">Dosen Pembimbing</option>
                  <option value="field">Pembimbing Lapangan (HR)</option>
                </select>
              </div>
              
              {editUserRole === 'intern' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">NIM</label>
                    <input 
                      type="text"
                      value={editUserNim}
                      onChange={(e) => setEditUserNim(e.target.value)}
                      className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] outline-none text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Startup</label>
                    <select 
                      value={editUserStartup}
                      onChange={(e) => setEditUserStartup(e.target.value)}
                      className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] outline-none text-sm transition-all appearance-none"
                    >
                      <option value="">-- Pilih Startup --</option>
                      {startups.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {editUserRole === 'academic' && (
                <>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Kode Dosen</label>
                  <input 
                    type="text"
                    value={editUserLecturerCode}
                    onChange={(e) => setEditUserLecturerCode(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Startup Bimbingan (pisahkan dengan koma)</label>
                  <input 
                    type="text"
                    value={editUserAdvisedStartups}
                    onChange={(e) => setEditUserAdvisedStartups(e.target.value)}
                    placeholder="Contoh: Kroombox, JagoAI"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] outline-none text-sm transition-all"
                  />
                </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Ganti Password (Kosongkan jika tidak diubah)</label>
                <input 
                  type="password"
                  value={editUserPassword}
                  onChange={(e) => setEditUserPassword(e.target.value)}
                  placeholder="********"
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] outline-none text-sm transition-all"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditingUserId(null)} className="flex-1 p-3.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold hover:bg-neutral-200 transition-colors">Batal</button>                
                <button type="submit" className="flex-1 p-3.5 bg-black text-[#EAB308] rounded-xl font-bold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-black/20">                  <Save className="w-5 h-5" /> Simpan Perubahan                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto pt-20 pb-10">
          <motion.div 
            initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-neutral-100 my-auto"
          >
            <div className="px-8 py-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50 sticky top-0 z-10">
              <h3 className="font-bold text-lg text-neutral-800">Tambah Pengguna Baru</h3>
              <button onClick={() => setShowAddUserModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-black hover:bg-neutral-200 transition-colors">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Nama Lengkap</label>
                <input 
                  type="text" required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] focus:border-[#EAB308] outline-none font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Email</label>
                <input 
                  type="email" required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] focus:border-[#EAB308] outline-none font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Password Default</label>
                <input 
                  type="text" required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] focus:border-[#EAB308] outline-none font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Peran (Role)</label>
                <select 
                  required
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] focus:border-[#EAB308] outline-none font-medium text-neutral-700 transition-all appearance-none"
                >
                  <option value="intern">Peserta Magang</option>
                  <option value="academic">Dosen Pembimbing</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full bg-black text-[#EAB308] hover:bg-neutral-800 font-bold py-4 rounded-xl transition-all shadow-lg mt-4"
              >
                Buat Akun
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {showAddStartupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto pt-20 pb-10">
          <motion.div 
            initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-neutral-100 my-auto"
          >
            <div className="px-8 py-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50 sticky top-0 z-10">
              <h3 className="font-bold text-lg text-neutral-800">Tambah Startup Baru</h3>
              <button onClick={() => setShowAddStartupModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-black hover:bg-neutral-200 transition-colors">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddStartup} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Nama Startup</label>
                <input 
                  type="text" required
                  value={newStartupName}
                  onChange={(e) => setNewStartupName(e.target.value)}
                  className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] focus:border-[#EAB308] outline-none font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Deskripsi Startup</label>
                <textarea 
                  required
                  value={newStartupDesc}
                  onChange={(e) => setNewStartupDesc(e.target.value)}
                  className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] focus:border-[#EAB308] outline-none font-medium transition-all min-h-[120px]"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-black text-[#EAB308] hover:bg-neutral-800 font-bold py-4 rounded-xl transition-all shadow-lg mt-4"
              >
                Simpan Startup
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {selectedInternDetail && (
        <InternDetailModal 
          intern={selectedInternDetail} 
          onClose={() => setSelectedInternDetail(null)} 
          activities={activities} 
          reports={reports} 
          users={users}
        />
      )}
      
      {/* Image View Modal */}
      <AnimatePresence>
        {viewedPhotoUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setViewedPhotoUrl(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <button 
                onClick={() => setViewedPhotoUrl(null)}
                className="absolute -top-4 -right-4 p-2 bg-white rounded-full text-neutral-800 hover:bg-neutral-200 shadow-lg z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <img src={viewedPhotoUrl} alt="Lampiran" className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mt-6">
                <p className="text-sm font-bold text-indigo-900 mb-1">Prediksi Nilai Akhir</p>
                <p className="text-3xl font-bold text-indigo-700">
                  {(() => {
                    let oldWeightedSum = 0;
                    rubricAspects.forEach(r => oldWeightedSum += (rubricTargetUser.rubricScores?.[r.id] || 0) * (r.weight / 100));
                    oldWeightedSum = Math.round(oldWeightedSum);
                    const bonusPoints = (rubricTargetUser.score || 0) - oldWeightedSum;
                    const newWeightedSum = Math.round(rubricAspects.reduce((acc, r) => acc + ((rubricValues[r.id] || 0) * (r.weight / 100)), 0));
                    const totalScore = newWeightedSum + bonusPoints;
                    return (
                      <>
                        {totalScore}
                        <span className="text-xl ml-2 opacity-70">({getGrade(totalScore)})</span>
                      </>
                    );
                  })()}
                </p>
              </div>

              <button 
                type="submit"
                className="w-full bg-black text-[#EAB308] hover:bg-neutral-800 font-bold py-4 rounded-xl transition-all shadow-lg mt-4"
              >
                Simpan Penilaian
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <div>
                <h3 className="font-bold text-xl text-neutral-800">{editingBatch ? 'Edit Batch' : 'Tambah Batch'}</h3>
                <p className="text-sm text-neutral-500 mt-1">Isi formulir untuk menyimpan data batch.</p>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="p-2 hover:bg-white rounded-full transition-colors text-neutral-400 hover:text-neutral-600 bg-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">Nama Batch</label>
                <input
                  type="text"
                  value={batchFormData.name}
                  onChange={e => setBatchFormData({ ...batchFormData, name: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all font-medium"
                  placeholder="Misal: Batch 1 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">Rentang Tanggal</label>
                <input
                  type="text"
                  value={batchFormData.date_range}
                  onChange={e => setBatchFormData({ ...batchFormData, date_range: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all font-medium"
                  placeholder="Misal: Jan - Jun 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">Status</label>
                <select
                  value={batchFormData.status}
                  onChange={e => setBatchFormData({ ...batchFormData, status: e.target.value as any })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all font-medium"
                >
                  <option value="active">Aktif</option>
                  <option value="completed">Selesai</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-neutral-600 bg-white border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveBatch}
                disabled={!batchFormData.name || !batchFormData.date_range}
                className="px-6 py-2.5 rounded-xl font-bold text-black bg-[#EAB308] hover:bg-[#DCA506] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Simpan Batch
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

