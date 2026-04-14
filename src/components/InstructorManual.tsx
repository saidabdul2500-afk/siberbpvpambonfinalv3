import React from 'react';
import { motion } from 'motion/react';
import { FileText, ListChecks, BookOpen, UploadCloud, Send, BarChart3, RotateCcw } from 'lucide-react';

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

const InstructorManual: React.FC = () => {
  const steps = [
    { number: 1, title: 'Mulai Pengajuan', description: 'Klik tombol \'Buat Pengajuan\' pada dashboard utama.', icon: FileText },
    { number: 2, title: 'Jenis Pelatihan', description: 'Pilih kategori pelatihan (PBK/PBL) yang sesuai.', icon: ListChecks },
    { number: 3, title: 'Program Pelatihan', description: 'Tentukan nama Program Pelatihan.', icon: BookOpen },
    { number: 4, title: 'Unggah Berkas', description: 'Pilih file daftar kebutuhan bahan dalam format PDF.', icon: UploadCloud },
    { number: 5, title: 'Kirim Data', description: 'Pastikan file benar, lalu tekan tombol \'Kirim Pengajuan\'.', icon: Send },
    { number: 6, title: 'Monitoring', description: 'Pantau status usulan Anda secara berkala di menu \'Riwayat\'.', icon: BarChart3 },
    { number: 7, title: 'Respon Revisi', description: 'Jika ada \'Catatan\' revisi, segera perbaiki dan gunakan fitur \'Kirim Ulang\'.', icon: RotateCcw },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step) => (
          <ManualCard key={step.number} {...step} />
        ))}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Indikator Status</h4>
        <div className="flex flex-wrap gap-3">
          <span className="inline-block px-3 py-1.5 text-[9px] font-semibold rounded-xl uppercase tracking-widest border shadow-sm bg-amber-50 text-amber-700 border-amber-200">
            Menunggu Verifikasi Penyelenggara
          </span>
          <span className="inline-block px-3 py-1.5 text-[9px] font-semibold rounded-xl uppercase tracking-widest border shadow-sm bg-blue-50 text-blue-700 border-blue-200">
            Diverifikasi Penyelenggara, Menunggu Persetujuan TU
          </span>
          <span className="inline-block px-3 py-1.5 text-[9px] font-semibold rounded-xl uppercase tracking-widest border shadow-sm bg-purple-100 text-purple-800 border-purple-200">
            Disetujui TU, Menunggu Persetujuan PPK
          </span>
          <span className="inline-block px-3 py-1.5 text-[9px] font-semibold rounded-xl uppercase tracking-widest border shadow-sm bg-green-50 text-green-700 border-green-200">
            Disetujui PPK, Dalam Proses Pengadaan
          </span>
          <span className="inline-block px-3 py-1.5 text-[9px] font-semibold rounded-xl uppercase tracking-widest border shadow-sm bg-green-800 text-white border-green-900">
            Bahan Tersedia / Sudah Tiba
          </span>
          <span className="inline-block px-3 py-1.5 text-[9px] font-semibold rounded-xl uppercase tracking-widest border shadow-sm bg-red-50 text-red-700 border-red-200">
            Revisi / Ditolak
          </span>
        </div>
      </div>
    </div>
  );
};

export default InstructorManual;
