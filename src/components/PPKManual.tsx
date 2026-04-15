import React from 'react';
import { motion } from 'motion/react';
import { FileSearch, CheckCircle2, RotateCcw } from 'lucide-react';

interface ManualCardProps {
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
}

const ManualCard: React.FC<ManualCardProps> = ({ number, title, description, icon: Icon }) => (
  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow">
    <div className="bg-[#003399] p-4 flex items-center gap-4">
      <div className="bg-blue-100 text-blue-700 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg">
        {number}
      </div>
      <Icon className="text-white" size={24} />
      <h3 className="text-white font-black uppercase tracking-widest text-sm">{title}</h3>
    </div>
    <div className="p-6">
      <p className="text-slate-600 text-sm font-medium leading-relaxed">{description}</p>
    </div>
  </div>
);

const PPKManual: React.FC = () => {
  const steps = [
    { 
      number: 1, 
      title: 'Review Usulan', 
      description: 'Tekan "REVIEW & SETUJUI" pada menu validasi usulan untuk melihat isi usulan.', 
      icon: FileSearch 
    },
    { 
      number: 2, 
      title: 'Persetujuan Final', 
      description: 'Tekan "KONFIRMASI & SETUJUI FINAL" jika usulan sudah sesuai.', 
      icon: CheckCircle2 
    },
    { 
      number: 3, 
      title: 'Proses Revisi', 
      description: 'Tekan "KEMBALIKAN (REVISI)" jika usulan perlu diperbaiki, masukkan catatan revisi, kemudian tekan "KIRIM REVISI".', 
      icon: RotateCcw 
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step) => (
          <ManualCard key={step.number} {...step} />
        ))}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Informasi Penting PPK</h4>
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
            • Persetujuan PPK adalah tahap akhir sebelum pengajuan masuk ke proses pengadaan.
          </p>
          <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
            • Pastikan seluruh kelengkapan teknis dan administrasi telah diverifikasi oleh Penyelenggara dan TU.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PPKManual;
