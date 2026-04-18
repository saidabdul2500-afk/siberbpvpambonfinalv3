
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, AlertCircle, Loader2, CheckCircle2, X, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, user, onLogout }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password Visibility States
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validasi State
  const [errors, setErrors] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Regex: Huruf, Angka, Simbol, Maksimal 8 Karakter
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@#$%\^&+=!]).{1,8}$/;

  const validate = () => {
    let isValid = true;
    const newErrs = { newPassword: '', confirmPassword: '' };

    if (newPassword && !passwordRegex.test(newPassword)) {
      newErrs.newPassword = 'Password harus mengandung Huruf, Angka, Simbol dan maksimal 8 karakter.';
      isValid = false;
    }

    if (confirmPassword && confirmPassword !== newPassword) {
      newErrs.confirmPassword = 'Konfirmasi password tidak cocok.';
      isValid = false;
    }

    setErrors(newErrs);
    return isValid;
  };

  useEffect(() => {
    validate();
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !oldPassword) return;

    setIsLoading(true);
    setError(null);

    try {
      const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
      if (!scriptUrl) {
        throw new Error('Konfigurasi URL Apps Script belum diatur (VITE_APPS_SCRIPT_URL).');
      }

      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Bypass CORS preflight for simplified-CORS requests in Apps Script
        },
        body: JSON.stringify({
          action: 'changePassword',
          username: user.username,
          oldPassword,
          newPassword
        }),
      });

      const result = await response.json();

      if (result.result === 'success') {
        setSuccess(true);
        setTimeout(() => {
          onLogout(); // Logout otomatis setelah sukses
        }, 3000);
      } else {
        setError(result.error || 'Password Lama Salah atau terjadi kesalahan sistem.');
      }
    } catch (err: any) {
      setError(err.message || 'Koneksi Gagal. Silakan coba lagi nanti.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = oldPassword && newPassword && confirmPassword && 
                      passwordRegex.test(newPassword) && 
                      newPassword === confirmPassword;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#003399] px-8 py-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Lock size={20} />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight">Ganti Password</h3>
              </div>
              {!success && (
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="p-8">
              {success ? (
                <div className="text-center py-10 space-y-6">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"
                  >
                    <CheckCircle2 size={40} />
                  </motion.div>
                  <div>
                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Password Berhasil Diganti!</h4>
                    <p className="text-slate-500 text-sm mt-2">Sistem akan otomatis keluar dalam 3 detik...</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Password Lama */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Password Lama</label>
                    <div className="relative">
                      <input 
                        type={showOldPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Masukkan password saat ini"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-6 pr-14 text-sm font-bold text-slate-700 focus:border-[#003399] focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-[#003399] transition-colors"
                      >
                        {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Password Baru */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Password Baru</label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Huruf, Angka, Simbol (Maks 8)"
                        className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-6 pr-14 text-sm font-bold text-slate-700 focus:ring-4 transition-all outline-none ${
                          errors.newPassword ? 'border-red-200 focus:border-red-500 focus:ring-red-50' : 'border-slate-100 focus:border-[#003399] focus:ring-blue-50'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-[#003399] transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="text-[10px] font-bold text-red-500 flex items-center gap-1.5 px-2">
                        <AlertCircle size={12} /> {errors.newPassword}
                      </p>
                    )}
                  </div>

                  {/* Konfirmasi Password Baru */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Konfirmasi Password Baru</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi password baru"
                        className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-6 pr-14 text-sm font-bold text-slate-700 focus:ring-4 transition-all outline-none ${
                          errors.confirmPassword ? 'border-red-200 focus:border-red-500 focus:ring-red-50' : 'border-slate-100 focus:border-[#003399] focus:ring-blue-50'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-[#003399] transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[10px] font-bold text-red-500 flex items-center gap-1.5 px-2">
                        <AlertCircle size={12} /> {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-xs font-bold text-center">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button 
                    type="submit"
                    disabled={!isFormValid || isLoading}
                    className="w-full bg-[#003399] hover:bg-[#0d47a1] disabled:bg-slate-200 disabled:text-slate-400 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden relative"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>Sedang Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChangePasswordModal;
