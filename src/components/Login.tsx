import React, { useState } from 'react';
import { useAppContext } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User as UserIcon, Shield, Building2, Briefcase, Phone, Hash } from 'lucide-react';
import { Role } from '../types';

export default function Login() {
  const { login, register, startups } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [nim, setNim] = useState('');
  const [startup, setStartup] = useState('');
  const [lecturerCode, setLecturerCode] = useState('');
  const [advisedStartups, setAdvisedStartups] = useState<string[]>([]);
  const [role, setRole] = useState<Role>('intern');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const Swal = (await import('sweetalert2')).default;

    if (isLogin) {
      Swal.fire({
        title: 'Memproses...',
        text: 'Mohon tunggu sebentar',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      const success = await login(email, password);
      if (!success) {
        Swal.fire('Gagal', 'Email atau password salah.', 'error');
      } else {
        Swal.fire({
          title: 'Berhasil',
          text: 'Login berhasil!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } else {
      if (!name || !email || !password || !confirmPassword) {
        Swal.fire('Peringatan', 'Kolom wajib harus diisi.', 'warning');
        return;
      }
      
      if (password !== confirmPassword) {
        Swal.fire('Peringatan', 'Password dan Konfirmasi Password tidak cocok.', 'warning');
        return;
      }

      Swal.fire({
        title: 'Memproses...',
        text: 'Mendaftarkan akun Anda',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await register({
        name,
        email,
        password,
        role,
        score: role === 'intern' ? 100 : 0,
        attendanceCount: 0,
        totalDays: 0,
        nickname,
        phone,
        nim,
        startup,
        lecturerCode,
        advisedStartups
      });

      if (res?.success === false) {
        Swal.fire('Gagal', res.message, 'error');
      } else {
        Swal.fire({
          title: 'Berhasil',
          text: 'Akun berhasil didaftarkan!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 md:p-8 overflow-hidden font-sans bg-neutral-50/50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-100 relative z-10"
      >
        <div className="bg-black p-8 text-center text-[#EAB308]">
          <div className="mx-auto flex items-center justify-center mb-6 bg-white/5 p-4 rounded-[2rem] w-32 h-32">
            <img src="https://i.imgur.com/EGH7u4a.png" alt="Ko+Lab Logo" className="h-24 object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Ko+Lab Hub Creative</h1>
          <p className="text-sm font-medium text-neutral-400">Sistem Social Credit Score</p>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div 
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col justify-center"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-neutral-800 tracking-tight">
                  {isLogin ? 'Masuk ke Akun' : 'Daftar Akun'}
                </h2>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-2">Peran (Role)</label>
                      <div className="relative group">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#EAB308] transition-colors" />
                        <select 
                          value={role}
                          onChange={(e) => {
                            setRole(e.target.value as Role);
                            setError('');
                          }}
                          className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] focus:border-[#EAB308] outline-none transition-all appearance-none font-bold text-neutral-700 cursor-pointer"
                        >
                          <option value="intern">Peserta Magang</option>
                          <option value="academic">Pembimbing Akademik</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Nama Lengkap</label>
                        <div className="relative group">
                          <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-[#EAB308] transition-colors" />
                          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] focus:border-[#EAB308] outline-none transition-all text-sm font-medium" placeholder="Nama Lengkap" />
                        </div>
                      </div>
                      {role === 'intern' ? (
                        <div>
                          <label className="block text-sm font-bold text-neutral-700 mb-2">Nama Panggilan</label>
                          <div className="relative group">
                            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-[#EAB308] transition-colors" />
                            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] focus:border-[#EAB308] outline-none transition-all text-sm font-medium" placeholder="Nama Panggilan" />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-bold text-neutral-700 mb-2">Kode Dosen</label>
                          <div className="relative group">
                            <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-[#EAB308] transition-colors" />
                            <input type="text" value={lecturerCode} onChange={(e) => setLecturerCode(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] focus:border-[#EAB308] outline-none transition-all text-sm font-medium" placeholder="Kode Dosen" />
                          </div>
                        </div>
                      )}
                    </div>

                    {role === 'intern' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-bold text-neutral-700 mb-2">NIM</label>
                          <div className="relative group">
                            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-[#EAB308] transition-colors" />
                            <input type="text" value={nim} onChange={(e) => setNim(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] focus:border-[#EAB308] outline-none transition-all text-sm font-medium" placeholder="NIM" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-neutral-700 mb-2">Nomor Telepon</label>
                          <div className="relative group">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-[#EAB308] transition-colors" />
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] focus:border-[#EAB308] outline-none transition-all text-sm font-medium" placeholder="08..." />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      {role === 'intern' ? (
                        <>
                          <label className="block text-sm font-bold text-neutral-700 mb-2">Startup</label>
                          <div className="relative group">
                            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-[#EAB308] transition-colors" />
                            <select value={startup} onChange={(e) => setStartup(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] focus:border-[#EAB308] outline-none transition-all appearance-none text-sm font-medium text-neutral-700 cursor-pointer">
                              <option value="">Pilih Startup...</option>
                              {startups.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          <label className="block text-sm font-bold text-neutral-700 mb-2">Pembimbing Startup (Pilih Lebih Dari Satu)</label>
                          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus-within:ring-2 focus-within:ring-[#EAB308] focus-within:border-[#EAB308] transition-all">
                            {startups.map(s => (
                              <label key={s.id} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-neutral-700 hover:bg-white p-1 rounded-md transition-colors">
                                <input
                                  type="checkbox"
                                  value={s.name}
                                  checked={advisedStartups.includes(s.name)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setAdvisedStartups([...advisedStartups, s.name]);
                                    } else {
                                      setAdvisedStartups(advisedStartups.filter(name => name !== s.name));
                                    }
                                  }}
                                  className="w-4 h-4 text-[#EAB308] rounded border-neutral-300 focus:ring-[#EAB308]"
                                />
                                <span>{s.name}</span>
                              </label>
                            ))}
                            {startups.length === 0 && <span className="text-neutral-400 text-xs italic">Belum ada startup terdaftar</span>}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#EAB308] transition-colors" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] focus:border-[#EAB308] outline-none transition-all font-medium"
                      placeholder="hr.kolab@gmail.com"
                      required
                    />
                  </div>
                </div>

                <div className={!isLogin ? "grid grid-cols-1 sm:grid-cols-2 gap-5" : ""}>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#EAB308] transition-colors" />
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] focus:border-[#EAB308] outline-none transition-all font-medium"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-2">Konfirmasi Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#EAB308] transition-colors" />
                        <input 
                          type="password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#EAB308] focus:border-[#EAB308] outline-none transition-all font-medium"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#EAB308] hover:bg-[#DCA506] text-black font-black py-4 rounded-xl transition-all mt-6 shadow-lg shadow-yellow-500/20 text-lg"
                >
                  {isLogin ? 'Masuk' : 'Daftar'}
                </button>
              </form>

              <div className="mt-8 text-center text-sm font-medium text-neutral-500">
                {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
                <button 
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="text-black font-black hover:text-[#EAB308] transition-colors ml-1 underline underline-offset-4 decoration-2 decoration-neutral-300 hover:decoration-[#EAB308]"
                >
                  {isLogin ? 'Daftar sekarang' : 'Masuk di sini'}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}