import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { X, User as UserIcon, CheckCircle, Info, Clock, AlertCircle, Camera, MapPin } from 'lucide-react';
import { User, ActivityLog, BehaviorReport } from '../types';
import { getGrade } from '../utils';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from './Pagination';

interface Props {
  intern: User;
  onClose: () => void;
  activities: ActivityLog[];
  reports: BehaviorReport[];
  users: User[];
}

export default function InternDetailModal(props: Props) { 
  const { intern, onClose, activities, reports, users } = props;
  const [selectedPhoto, setSelectedPhoto] = React.useState<any>(null);
  const myActivities = activities.filter(a => a.internId === intern.id);
  const myReports = reports.filter(r => 
    r.targetId === intern.id || 
    (r.targetType === 'startup' && r.targetId === intern.startup)
  );

  const combinedHistory = useMemo(() => {
    const logs = myActivities.map(act => ({
      id: act.id,
      date: act.date,
      category: 'Laporan',
      description: act.activity,
      status: 'Disetujui',
      evaluatorId: null,
      impact: null,
      isStartup: false
    }));
    const rpts = myReports.map(rpt => ({
      id: rpt.id,
      date: rpt.date,
      category: 'Penilaian',
      description: rpt.description,
      status: rpt.type === 'good' ? 'Positif' : 'Negatif',
      evaluatorId: rpt.reporterId,
      impact: rpt.pointsImpact,
      isStartup: rpt.targetType === 'startup'
    }));
    return [...logs, ...rpts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [myActivities, myReports]);

  const paginationHistory = usePagination(combinedHistory, 10);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Positif':
      case 'Disetujui':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Negatif':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-end p-0 backdrop-blur-sm">
      <motion.div 
        initial={{ x: '100%' }} 
        animate={{ x: 0 }} 
        exit={{ x: '100%' }} 
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80">
          <h2 className="font-bold text-xl text-neutral-800">Detail Peserta</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Profil Ringkas */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-neutral-200 overflow-hidden shrink-0 border-4 border-white shadow-sm">
              {intern.photoUrl ? (
                <img src={intern.photoUrl} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <UserIcon className="w-full h-full p-4 text-neutral-400" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-black text-neutral-800 leading-tight">{intern.name}</h3>
              <p className="text-sm text-neutral-500 font-medium mb-2">{intern.email}</p>
              
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-bold bg-[#EAB308]/10 text-yellow-700 px-3 py-1 rounded-lg border border-[#EAB308]/20">
                  {intern.startup || 'Belum ada Startup'}
                </span>
                <span className="text-xs font-bold bg-neutral-100 text-neutral-700 px-3 py-1 rounded-lg border border-neutral-200">
                  NIM: {intern.nim || '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
             <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-center">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Skor Saat Ini</p>
                <div className="flex items-center justify-center gap-2">
                   <p className="text-3xl font-black text-neutral-800">{intern.score}</p>
                   <p className="text-lg font-bold text-[#EAB308]">({getGrade(intern.score)})</p>
                </div>
             </div>
             <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-center flex flex-col justify-center">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Status</p>
                <div>
                   <span className={`inline-block px-3 py-1 text-sm font-bold rounded-lg border ${intern.status === 'suspended' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                     {intern.status === 'suspended' ? 'Suspended' : 'Aktif'}
                   </span>
                </div>
             </div>
          </div>
          
          {/* Riwayat Aktivitas Mini Table */}
          <div>
            <h4 className="font-bold text-neutral-700 mb-3">Aktivitas & Penilaian Terbaru</h4>
            <div className="overflow-hidden border border-neutral-100 rounded-xl">
               <table className="w-full text-left text-sm">
                 <thead className="bg-neutral-50 text-neutral-500">
                   <tr>
                     <th className="py-2 px-3 font-bold text-[10px] uppercase">Waktu</th>
                     <th className="py-2 px-3 font-bold text-[10px] uppercase">Keterangan</th>
                     <th className="py-2 px-3 font-bold text-[10px] uppercase text-right">Skor</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-neutral-100">
                    {paginationHistory.currentData.map((item, idx) => {
                     let evaluatorStr = '';
                     if (item.evaluatorId) {
                       const rep = users.find(u => u.id === item.evaluatorId);
                       if (rep) {
                         evaluatorStr = `Oleh: ${rep.name}`;
                       }
                     }
                     return (
                       <tr key={idx} className="bg-white hover:bg-neutral-50 transition-colors">
                         <td className="py-3 px-3 align-top whitespace-nowrap">
                           <span className="text-[10px] font-bold text-neutral-500">
                             {new Date(item.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                           </span>
                         </td>
                         <td className="py-3 px-3 align-top">
                           <p className="text-xs font-semibold text-neutral-800 leading-snug mb-1">
                             {item.description}
                             {item.isStartup && <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">Startup</span>}
                           </p>
                           {evaluatorStr ? (
                             <p className="text-[10px] text-neutral-500 font-medium italic">{evaluatorStr}</p>
                           ) : (
                             <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-600">Laporan Pribadi</span>
                           )}
                         </td>
                          <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                            {item.impact !== null && item.impact !== undefined ? (
                              <span className={`text-xs font-bold ${item.impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.impact > 0 ? '+' : ''}{item.impact}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-400 font-medium">-</span>
                            )}
                          </td>
                       </tr>
                     )
                   })}
                   {combinedHistory.length === 0 && (
                     <tr>
                       <td colSpan={3} className="py-6 text-center text-neutral-500 font-medium">Belum ada aktivitas.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
            </div>
            <Pagination {...paginationHistory} />
          </div>

        </div>
      </motion.div>
    </div>
  );
}
