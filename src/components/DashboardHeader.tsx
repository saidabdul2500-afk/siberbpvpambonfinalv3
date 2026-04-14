
import React from 'react';
import { User, UserRole } from '../types';
import SiberLogo from './SiberLogo';

interface DashboardHeaderProps {
  user: User;
  onLogout: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, onLogout }) => {
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
              {(user.role === UserRole.ADMIN || user.role === UserRole.INSTRUCTOR) && (
                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
                  {user.role === UserRole.ADMIN ? 'Penyelenggara (Admin)' : `Instruktur ${user.vocation}`}
                </span>
              )}
            </div>
            
            <div className="h-10 w-px bg-white/20"></div>

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
    </header>
  );
};

export default DashboardHeader;
