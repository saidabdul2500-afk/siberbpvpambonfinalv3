
import React from 'react';
import { User, UserRole } from '../types';
import SiberLogo from './SiberLogo';

interface DashboardHeaderProps {
  user: User;
  onLogout: () => void;
  onOpenChangePassword: () => void;
  onOpenManual: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, onLogout, onOpenChangePassword, onOpenManual }) => {
  return (
    <header className="bg-[#003399] border-b border-white/10 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1 rounded-lg shadow-md flex items-center justify-center">
              <SiberLogo className="h-10 w-10" />
            </div>
            <div className="h-10 w-px bg-white/20 mx-1"></div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">SIBER BPVP AMBON</h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-black text-white">{user.displayName}</span>
              {(user.role === UserRole.ADMIN || user.role === UserRole.INSTRUCTOR || user.role === UserRole.KASUBAG_TU || user.role === UserRole.PPK) && (
                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
                  {user.role === UserRole.ADMIN ? 'Penyelenggara (Admin)' : 
                   user.role === UserRole.INSTRUCTOR ? `Instruktur ${user.vocation}` :
                   user.role === UserRole.KASUBAG_TU ? 'Kasubag TU' : 'Pejabat Pembuat Komitmen'}
                </span>
              )}
            </div>
            
            <div className="h-10 w-px bg-white/20"></div>

            <div className="flex items-center gap-3">
              <button 
                onClick={onOpenManual}
                className="group flex items-center gap-2 bg-white/5 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl transition-all border border-white/10 shadow-sm"
              >
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Panduan</span>
              </button>

              <button 
                onClick={onOpenChangePassword}
                className="group flex items-center gap-2 bg-white/5 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl transition-all border border-white/10 shadow-sm"
              >
                <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Ganti Password</span>
              </button>

              <button 
                onClick={onLogout}
                className="group flex items-center gap-2 bg-white/10 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl transition-all border border-white/10 hover:border-red-500 shadow-sm"
              >
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Keluar</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
