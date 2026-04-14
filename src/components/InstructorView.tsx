
import React, { useState, useEffect } from 'react';
import { MaterialRequest, RequestStatus, VocationalCategory, VOCATION_COLORS, PROGLAT_MAPPING, User, TrainingType, PBK_PROGRAMS, PBL_PROGRAMS } from '../types';
import { formatSafeDate, getSafeYear, formatSafeNumber } from '../lib/dateUtils';
import PDFPreview from './PDFPreview';

interface InstructorViewProps {
  user: User;
  requests: MaterialRequest[];
  onSubmit: (req: Partial<MaterialRequest>) => void;
}

const InstructorView: React.FC<InstructorViewProps> = ({ user, requests, onSubmit }) => {
  const [showForm, setShowForm] = useState(false);
  const [trainingType, setTrainingType] = useState<TrainingType>(TrainingType.PBK);
  const [kejuruan, setKejuruan] = useState<string>('');
  const [programPelatihan, setProgramPelatihan] = useState('');
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [attachmentData, setAttachmentData] = useState<string | null>(null);

  // Detail Modal State
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState<MaterialRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDetailTableZoomed, setIsDetailTableZoomed] = useState(false);

  // Revision Modal State
  const [selectedRequestForNote, setSelectedRequestForNote] = useState<MaterialRequest | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [detailBlobUrl, setDetailBlobUrl] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Body Scroll Lock
  useEffect(() => {
    if (isDetailModalOpen || isNoteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDetailModalOpen, isNoteModalOpen]);

  // Convert base64 to Blob URL for Detail Modal
  useEffect(() => {
    if (isDetailModalOpen && selectedRequestForDetail?.attachmentData) {
      const data = selectedRequestForDetail.attachmentData;
      
      // If it's already a URL, just use it
      if (data.startsWith('http://') || data.startsWith('https://')) {
        setDetailBlobUrl(data);
        return;
      }

      try {
        const binary = atob(data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setDetailBlobUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Failed to create blob URL", e);
      }
    } else {
      setDetailBlobUrl(null);
    }
  }, [isDetailModalOpen, selectedRequestForDetail]);

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    
    // Create preview URL for PDF
    if (selectedFile.type === 'application/pdf') {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    try {
      const base64 = await readFileAsBase64(selectedFile);
      if (base64.length > 48000) {
        alert("Peringatan: Ukuran file PDF cukup besar. Google Sheets memiliki batas 50.000 karakter per sel. Jika file tidak muncul di pratinjau nantinya, silakan kompres PDF Anda atau gunakan file yang lebih kecil.");
      }
      setAttachmentData(base64);
    } catch (error) {
      console.error("File processing failed:", error);
      alert("Terjadi kesalahan saat memproses file. Silakan coba lagi.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Silakan upload dokumen pengajuan (Excel/PDF) terlebih dahulu!");

    setIsSubmitting(true);
    try {
      await onSubmit({
        trainingTitle: programPelatihan,
        vocation: kejuruan as VocationalCategory,
        proglat: programPelatihan,
        items: [],
        attachmentName: file.name,
        attachmentData: attachmentData || undefined,
        instructorName: user.displayName,
        status: RequestStatus.PENDING,
        dateSubmitted: new Date().toISOString(),
        trainingType,
        programPelatihan,
        kejuruan: kejuruan as VocationalCategory
      });
      
      setFile(null);
      setPreviewUrl(null);
      setAttachmentData(null);
      setShowForm(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetailModal = (req: MaterialRequest) => {
    setSelectedRequestForDetail(req);
    setIsDetailModalOpen(true);
    setIsDetailTableZoomed(false);
  };

  const openNoteModal = (req: MaterialRequest) => {
    setSelectedRequestForNote(req);
    setIsNoteModalOpen(true);
  };

  const handlePerbaiki = () => {
    if (selectedRequestForNote) {
      setKejuruan(selectedRequestForNote.kejuruan);
      setProgramPelatihan(selectedRequestForNote.programPelatihan);
      setTrainingType(selectedRequestForNote.trainingType);
      setShowForm(true);
      setIsNoteModalOpen(false);
    }
  };

  const getLatestComment = (req: MaterialRequest) => {
    if (req.ppkComment) return `[PPK]: ${req.ppkComment}`;
    if (req.tuComment) return `[TU]: ${req.tuComment}`;
    if (req.organizerComment) return `[Penyelenggara]: ${req.organizerComment}`;
    return null;
  };

  const openPdfInNewTab = (base64Data: string) => {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.error("Gagal membuka PDF di tab baru:", e);
      alert("Gagal membuka PDF. Data mungkin rusak atau tidak lengkap.");
    }
  };

  return (
    <div className="space-y-6 min-h-screen overflow-y-visible pb-20">
      {/* Detail Modal */}
      {isDetailModalOpen && selectedRequestForDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header & Identitas Berkas */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="bg-[#003399] p-3 rounded-2xl shadow-lg shadow-blue-100">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase truncate max-w-md">
                    {selectedRequestForDetail.attachmentName || 'Dokumen Pengajuan'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {selectedRequestForDetail.trainingTitle} • {formatSafeDate(selectedRequestForDetail.dateSubmitted, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {/* Area Live Preview (Pusat) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Pratinjau Dokumen</h4>
                  <div className="flex items-center gap-4">
                    {detailBlobUrl && (
                      <a 
                        href={detailBlobUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        Buka di Tab Baru
                      </a>
                    )}
                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Mode Viewer Aktif
                    </div>
                  </div>
                </div>
                
                <div className="border-2 border-slate-100 rounded-[2rem] bg-slate-50 shadow-inner h-[600px] relative group overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300">
                  {(selectedRequestForDetail.signedDocumentData || selectedRequestForDetail.attachmentData) ? (
                    <PDFPreview data={selectedRequestForDetail.signedDocumentData || selectedRequestForDetail.attachmentData!} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-6 bg-slate-50 p-8 text-center">
                      <div className="bg-slate-100 p-6 rounded-full">
                        <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">Pratinjau Tidak Tersedia</p>
                        <p className="text-[11px] font-bold text-slate-400 max-w-xs mx-auto leading-relaxed">
                          Data dokumen mungkin terlalu besar untuk disimpan di database Spreadsheet (Limit 50rb karakter). 
                          Gunakan file PDF yang sudah dikompres atau berukuran kecil.
                        </p>
                      </div>
                      
                      {(selectedRequestForDetail.signedDocumentData || selectedRequestForDetail.attachmentData) && (
                        <div className="flex gap-3">
                          <button 
                            onClick={() => openPdfInNewTab(selectedRequestForDetail.signedDocumentData || selectedRequestForDetail.attachmentData!)}
                            className="bg-[#003399] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg shadow-blue-100"
                          >
                            Buka di Tab Baru
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-6 py-2 rounded-full">
                    GUNAKAN SCROLL DAN FITUR ZOOM BROWSER PADA VIEWER DI ATAS
                  </p>
                </div>
              </div>

              {/* Hasil Ekstraksi Sistem (Bawah) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Hasil Ekstraksi Sistem</h4>
                  <button 
                    onClick={() => setIsDetailTableZoomed(!isDetailTableZoomed)}
                    className="bg-blue-50 text-[#003399] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
                  >
                    {isDetailTableZoomed ? 'Kecilkan' : 'Perbesar'}
                  </button>
                </div>

                <div className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                  <div className={`${isDetailTableZoomed ? 'max-h-none' : 'max-h-[400px]'} overflow-y-auto custom-scrollbar`}>
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50/50 sticky top-0 z-10">
                        <tr>
                          <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Barang</th>
                          <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Spesifikasi</th>
                          <th className="px-8 py-5 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Satuan</th>
                          <th className="px-8 py-5 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {selectedRequestForDetail.items.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-xs italic font-bold">
                              Tidak ada data item yang diekstrak
                            </td>
                          </tr>
                        ) : selectedRequestForDetail.items.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-8 py-5 text-sm font-bold text-slate-700">{item.name}</td>
                            <td className="px-8 py-5 text-xs text-slate-500 leading-relaxed">{item.spec || (item as any).specification}</td>
                            <td className="px-8 py-5 text-center text-xs font-bold text-slate-600 uppercase">{item.unit}</td>
                            <td className="px-8 py-5 text-center text-sm font-black text-[#003399]">{formatSafeNumber(item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigasi */}
            <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-center">
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="bg-slate-900 hover:bg-black text-white px-12 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal for Revision */}
      {isNoteModalOpen && selectedRequestForNote && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="overflow-y-auto p-8 custom-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-red-100 p-3 rounded-2xl">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2">Pesan Verifikasi</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed italic">
                Berikut adalah riwayat catatan untuk pengajuan <b>"{selectedRequestForNote.trainingTitle}"</b>:
              </p>

              <div className="space-y-4 mb-8">
                {selectedRequestForNote.organizerComment && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-2xl">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Penyelenggara (Teknis)</p>
                    <p className="text-sm text-slate-700 font-bold">{selectedRequestForNote.organizerComment}</p>
                  </div>
                )}
                {selectedRequestForNote.tuComment && (
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-2xl">
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Kasubag TU (Administrasi)</p>
                    <p className="text-sm text-slate-700 font-bold">{selectedRequestForNote.tuComment}</p>
                  </div>
                )}
                {selectedRequestForNote.ppkComment && (
                  <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-2xl">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">PPK (Final)</p>
                    <p className="text-sm text-slate-700 font-bold">{selectedRequestForNote.ppkComment}</p>
                  </div>
                )}
                {!selectedRequestForNote.organizerComment && !selectedRequestForNote.tuComment && !selectedRequestForNote.ppkComment && (
                  <p className="text-center text-slate-400 italic text-sm py-4">Tidak ada catatan tersedia.</p>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsNoteModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-colors"
                >
                  Tutup
                </button>
                <button 
                  onClick={handlePerbaiki}
                  className="flex-[2] bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-100 transition-all active:scale-95"
                >
                  Perbaiki Pengajuan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">INSTRUKTUR</h2>
          <p className="text-slate-500 text-sm">Hanya menampilkan data pengajuan milik <b>{user.displayName}</b>.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#003399] hover:bg-[#0d47a1] text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-100 active:scale-95"
        >
          {showForm ? 'Tutup Form' : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Buat Pengajuan
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 mb-12">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
              <div className="bg-blue-50 p-3 rounded-2xl">
                <svg className="w-6 h-6 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Form Pengajuan Bahan</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">JENIS PELATIHAN</label>
                  <select
                    value={trainingType}
                    onChange={(e) => {
                      setTrainingType(e.target.value as TrainingType);
                      setProgramPelatihan('');
                      setKejuruan('');
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-[#003399] transition-all cursor-pointer appearance-none"
                  >
                    <option value="" disabled>Pilih Jenis Pelatihan...</option>
                    {Object.values(TrainingType).map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Program Pelatihan</label>
                  <button
                    type="button"
                    onClick={() => setIsProgramModalOpen(true)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-[#003399] transition-all text-left flex justify-between items-center"
                  >
                    {programPelatihan || 'Pilih Program Pelatihan...'}
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
                
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Dokumen Lampiran (Excel/PDF)</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
                      isDragging ? 'border-[#003399] bg-blue-50' : 'border-slate-200 hover:border-[#003399] bg-slate-50'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".xlsx,.xls,.pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-4">
                      {file ? (
                        <>
                          <div className="bg-green-100 p-4 rounded-2xl mb-1 shadow-sm">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-sm font-black text-slate-800 truncate max-w-full px-4">{file.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Klik untuk mengganti berkas</span>
                        </>
                      ) : (
                        <>
                          <div className="bg-blue-100 p-4 rounded-2xl mb-1 shadow-sm">
                            <svg className="w-10 h-10 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <span className="text-sm font-bold text-slate-600">Seret file ke sini atau klik untuk memilih</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Hanya mendukung: Excel & PDF</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Preview Section */}
                {file && (
                  <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Live Preview & Verifikasi Data</h4>
                    </div>

                    {/* Document Viewer (PDF) */}
                    {previewUrl && (
                      <div className="border-2 border-slate-200 rounded-3xl overflow-hidden bg-slate-100 shadow-inner group relative">
                        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            type="button"
                            onClick={() => window.open(previewUrl)}
                            className="bg-white/90 backdrop-blur shadow-lg p-3 rounded-xl text-[#003399] hover:bg-white transition-all"
                            title="Buka di Tab Baru"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </button>
                        </div>
                        <div className="max-h-[500px] w-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300">
                          <iframe 
                            src={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=1`} 
                            className="w-full h-[800px] border-none" 
                            title="PDF Preview"
                            scrolling="yes"
                          />
                        </div>
                        <div className="bg-white p-4 border-t border-slate-200 flex justify-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gunakan scroll dan fitur zoom browser pada viewer di atas</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-8 border-t border-slate-100 flex justify-end items-center gap-6">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest hidden sm:block">
                  Pastikan data yang diunggah valid
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#003399] text-white px-14 py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-xs shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center gap-3 hover:bg-[#0d47a1] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      MENGIRIM...
                    </>
                  ) : (
                    <>
                      Kirim Pengajuan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isProgramModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Pilih Program Pelatihan</h3>
              <button onClick={() => setIsProgramModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {Object.entries(trainingType === TrainingType.PBK ? PBK_PROGRAMS : PBL_PROGRAMS).map(([vocation, programs]) => (
                <div key={vocation} className="mb-6">
                  <h4 className="text-xs font-black text-[#003399] uppercase tracking-widest mb-3">-- {vocation} --</h4>
                  <div className="space-y-2">
                    {programs.map(program => (
                      <button
                        key={program}
                        onClick={() => {
                          setProgramPelatihan(program);
                          setKejuruan(vocation);
                          setIsProgramModalOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-[#003399] transition-all"
                      >
                        {program}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="min-w-[900px] w-full table-auto divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kelas & Program</th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lampiran</th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tanggal</th>
                <th className="px-6 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Catatan</th>
                <th className="px-6 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="text-slate-300 italic flex flex-col items-center gap-3">
                      <svg className="w-14 h-14 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                      <span className="font-bold uppercase tracking-widest text-xs">Belum ada pengajuan terdaftar</span>
                    </div>
                  </td>
                </tr>
              ) : requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="text-sm font-black text-slate-800 mb-2">{req.trainingTitle}</div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-3 py-0.5 rounded-full font-black uppercase border shadow-sm ${VOCATION_COLORS[req.vocation] || 'bg-slate-100'}`}>
                          {req.vocation}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">{req.proglat}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    {req.attachmentName ? (
                       <div className="flex items-center gap-2 text-[11px] font-black text-[#003399] bg-blue-50 px-3 py-2 rounded-xl w-fit border border-blue-100">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                         {req.attachmentName}
                       </div>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic font-medium uppercase">No File</span>
                    )}
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap">
                    <div className="text-xs font-black text-slate-700">{formatSafeDate(req.dateSubmitted)}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{getSafeYear(req.dateSubmitted)}</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex justify-center">
                      <span className={`inline-block px-3 py-1.5 text-[9px] font-semibold rounded-xl uppercase tracking-widest border shadow-sm whitespace-nowrap min-w-[150px] text-center ${
                        req.status === RequestStatus.APPROVED_FINAL ? 'bg-green-50 text-green-700 border-green-200' :
                        req.status === RequestStatus.PENDING ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        req.status === RequestStatus.REVISION ? 'bg-red-50 text-red-700 border-red-200' :
                        req.status === RequestStatus.APPROVED_TECHNICAL ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        req.status === RequestStatus.APPROVED_ADMIN ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    {(req.organizerComment || req.tuComment || req.ppkComment) ? (
                      <button 
                        onClick={() => openNoteModal(req)}
                        className="text-[9px] font-black uppercase text-amber-600 hover:text-white bg-amber-50 hover:bg-amber-600 px-4 py-2 rounded-lg transition-all tracking-widest border border-amber-100 shadow-sm active:scale-95 whitespace-nowrap"
                      >
                        Lihat Catatan
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-6 text-right">
                    <button 
                      onClick={() => openDetailModal(req)}
                      className="text-[10px] font-black uppercase px-5 py-2.5 rounded-xl transition-all tracking-[0.15em] border text-[#003399] hover:text-white bg-blue-50 hover:bg-[#003399] border-blue-100 shadow-sm active:scale-95"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-bounce">
          <div className="bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-emerald-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-black uppercase tracking-widest">Berhasil dikirim!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorView;
