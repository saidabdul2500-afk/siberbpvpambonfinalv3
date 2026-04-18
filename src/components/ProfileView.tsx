
import React, { useState } from 'react';
import { User, UserRole, VocationalCategory } from '../types';

interface ProfileViewProps {
  user: User;
  onLogout: () => void;
  openChangePassword: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout, openChangePassword }) => {
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
            onClick={openChangePassword}
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
