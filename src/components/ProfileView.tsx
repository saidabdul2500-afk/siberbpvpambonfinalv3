
import React, { useState } from 'react';
import { User, UserRole, VocationalCategory } from '../types';

interface ProfileViewProps {
  user: User;
  onLogout: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout }) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' });
      return;
    }
    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'Password minimal 4 karakter' });
      return;
    }
    
    // Simulate password change
    setMessage({ type: 'success', text: 'Password berhasil diperbarui!' });
    setTimeout(() => {
      setIsPasswordModalOpen(false);
      setMessage(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Header Card */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-[#003399] flex items-center justify-center text-3xl font-black text-white mb-4 shadow-xl shadow-blue-100 ring-4 ring-blue-50">
          {user.displayName.charAt(0)}
        </div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{user.displayName}</h2>
        <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full border border-blue-100">
          <span className="w-2 h-2 rounded-full bg-[#003399]"></span>
          <span className="text-[10px] font-black text-[#003399] uppercase tracking-widest">
            {user.role === UserRole.ADMIN ? 'Penyelenggara' : 
             user.role === UserRole.KASUBAG_TU ? 'Kasubag TU' :
             user.role === UserRole.PPK ? 'PPK' :
             `Instruktur ${user.vocation}`}
          </span>
        </div>
      </div>

      {/* Menu List Card */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-50">
          {/* Menu Item: Tentang */}
          <button className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 p-3 rounded-2xl group-hover:bg-emerald-100 transition-colors">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Tentang Aplikasi</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Dikembangkan oleh {user.displayName} - Latsar CPNS 2026
                </p>
              </div>
            </div>
          </button>

          {/* Menu Item: Keamanan */}
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-amber-50 p-3 rounded-2xl group-hover:bg-amber-100 transition-colors">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Keamanan</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ganti Password Akun</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ganti Password</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password Baru</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:border-[#003399] transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Konfirmasi Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:border-[#003399] transition-all"
                  placeholder="••••••••"
                />
              </div>

              {message && (
                <div className={`p-4 rounded-2xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#003399] text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-800 transition-all active:scale-95 mt-4"
              >
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <button 
        onClick={onLogout}
        className="w-full bg-red-50 hover:bg-red-100 text-red-600 p-6 rounded-[2rem] flex items-center justify-center gap-3 transition-all border-2 border-red-100 active:scale-95"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="text-sm font-black uppercase tracking-[0.2em]">Keluar dari Sistem</span>
      </button>

      {/* Footer Branding for Profile */}
      <div className="text-center pt-4">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">SimPro Mobile v2.1.0</p>
      </div>
    </div>
  );
};

export default ProfileView;
