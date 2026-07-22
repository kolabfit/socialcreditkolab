import React from 'react';
import { AppProvider, useAppContext } from './store';
import Login from './components/Login';
import InternDashboard from './components/InternDashboard';
import AcademicDashboard from './components/AcademicDashboard';
import FieldDashboard from './components/FieldDashboard';
import AnimatedBackground from './components/AnimatedBackground';
import { LogOut, User as UserIcon, BarChart3, Users, Star, FileText, Settings, AlertCircle, Menu, X } from 'lucide-react';

function DashboardLayout() {
  const { currentUser, logout, loading } = useAppContext();

  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'users' | 'scores' | 'activities' | 'reports' | 'attendance' | 'settings' | 'profile' | 'incidents'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent relative z-50">
        <div className="w-12 h-12 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[#A16207] font-bold text-sm tracking-wider uppercase animate-pulse">Memuat Ko+Lab Hub...</p>
      </div>
    );
  }

  if (!currentUser) return <Login />;

  const renderDashboardContent = () => {
    switch (currentUser.role) {
      case 'intern':
        return <InternDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'academic':
        return <AcademicDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'field':
        return <FieldDashboard activeTab={activeTab} />;
      default:
        return <div>Invalid Role</div>;
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'intern') return 'Peserta Magang';
    if (role === 'academic') return 'Pembimbing Akademik';
    if (role === 'field') return 'Pembimbing Lapangan / HR';
    return role;
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // Build navigation items based on role
  const getNavItems = () => {
    if (currentUser.role === 'field') {
      return [
        { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
        { id: 'users' as const, label: 'Kelola Pengguna', icon: Users },
        { id: 'scores' as const, label: 'Penilaian Score', icon: Star },
        { id: 'incidents' as const, label: 'Laporan Kejadian', icon: AlertCircle },
        { id: 'reports' as const, label: 'Riwayat Penilaian', icon: FileText },
        { id: 'settings' as const, label: 'System Settings', icon: Settings },
      ];
    }
    if (currentUser.role === 'academic') {
      return [
        { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
        { id: 'users' as const, label: 'Peserta Magang', icon: Users },
        { id: 'scores' as const, label: 'Penilaian Score', icon: Star },
        { id: 'reports' as const, label: 'Riwayat Penilaian', icon: FileText },
        { id: 'profile' as const, label: 'Profil', icon: UserIcon },
      ];
    }
    // intern
    return [
      { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
      { id: 'incidents' as const, label: 'Laporan Kejadian', icon: AlertCircle },
      { id: 'reports' as const, label: 'Riwayat', icon: FileText },
      { id: 'profile' as const, label: 'Profil', icon: UserIcon },
    ];
  };

  const navItems = getNavItems();

  // Sidebar content (shared between desktop and mobile)
  const SidebarContent = () => (
    <>
      <div className="p-8 pb-4 flex flex-col items-center border-b border-white/5">
        <div className="bg-white/5 p-4 rounded-3xl mb-4">
          <img src="https://i.imgur.com/EGH7u4a.png" alt="Ko+Lab Logo" className="h-16 object-contain" />
        </div>
        <h1 className="font-bold text-xl tracking-tight text-center">Ko+Lab Hub Creative</h1>
      </div>
      
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-neutral-900 flex shrink-0 items-center justify-center border-2 border-neutral-800 text-[#EAB308] overflow-hidden">
            {currentUser.photoUrl ? (
              <img src={currentUser.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-6 h-6" />
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate text-white">{currentUser.name}</p>
            <p className="text-xs font-semibold text-[#EAB308] truncate">{getRoleLabel(currentUser.role)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <nav className="space-y-2 mb-8">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-[#EAB308] text-black shadow-lg shadow-yellow-500/20' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon className="w-5 h-5" /> {item.label}
            </button>
          ))}
        </nav>

        <div className="bg-neutral-900/50 p-4 rounded-2xl border border-white/5">
          <p className="text-xs text-neutral-400 font-medium leading-relaxed">
            Sistem Social Credit Score untuk memantau penilaian kedisiplinan.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 p-4 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-xl transition-all font-bold"
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-transparent overflow-hidden font-sans text-neutral-900">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-black text-white hidden md:flex flex-col border-r border-[#EAB308]/20 shadow-2xl z-40 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sidebar panel */}
          <aside className="absolute top-0 left-0 w-72 h-full bg-black text-white flex flex-col shadow-2xl z-10 animate-slide-in">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-5 right-5 z-20 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Mobile Header + Content */}
      <div className="flex flex-col w-full md:hidden h-full">
        <header className="bg-black text-white sticky top-0 z-40 border-b border-[#EAB308]/20 shadow-lg shrink-0">
          <div className="px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="bg-white/5 p-1.5 rounded-xl">
                <img src="https://i.imgur.com/EGH7u4a.png" alt="Ko+Lab Logo" className="h-8 object-contain" />
              </div>
              <span className="font-bold text-base tracking-tight truncate max-w-[120px]">Ko+Lab Hub</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-900 flex shrink-0 items-center justify-center border-2 border-neutral-800 text-[#EAB308] overflow-hidden">
                {currentUser.photoUrl ? (
                  <img src={currentUser.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </div>
              <button 
                onClick={logout}
                className="p-2 text-neutral-400 hover:text-red-400 bg-neutral-900 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 pb-20">
          {renderDashboardContent()}
        </main>
        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-[#EAB308]/20 md:hidden">
          <div className="flex items-center justify-around h-16 px-1">
            {navItems.slice(0, 5).map(item => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-0 flex-1 ${
                  activeTab === item.id 
                    ? 'text-[#EAB308]' 
                    : 'text-neutral-500'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="text-[10px] font-bold truncate w-full text-center">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Desktop Main Content */}
      <main className="hidden md:block flex-1 overflow-y-auto p-8 lg:p-12 relative">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          {renderDashboardContent()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AnimatedBackground />
      <DashboardLayout />
    </AppProvider>
  );
}


