
import React, { useState } from 'react';
import { MaterialRequest, RequestStatus, VOCATION_COLORS, User, UserRole, instructorNameMap } from '../types';
import { formatSafeDate, getSafeYear } from '../lib/dateUtils';
import PDFPreview from './PDFPreview';

interface PPKViewProps {
  user: User;
  requests: MaterialRequest[];
  onAction: (id: string, status: RequestStatus, comment?: string, signedDocName?: string, signedDocData?: string) => void;
}

const PPKView: React.FC<PPKViewProps> = ({ user, requests, onAction }) => {
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [ppkNote, setPpkNote] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isArchiveView, setIsArchiveView] = useState(false);

  const ppkRequests = requests.filter(r => r.status === RequestStatus.APPROVED_ADMIN);
  const ppkArchive = requests.filter(r => 
    r.status === RequestStatus.APPROVED_FINAL || 
    r.status === RequestStatus.COMPLETED
  );

  // Body Scroll Lock for Modals
  React.useEffect(() => {
    if (isReviewModalOpen || isRevisionModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isReviewModalOpen, isRevisionModalOpen]);

  const handleOpenReview = (req: MaterialRequest, isArchive: boolean = false) => {
    setSelectedRequest(req);
    setIsReviewModalOpen(true);
    setIsArchiveView(isArchive);
  };

  const handleOpenRevision = () => {
    setIsRevisionModalOpen(true);
  };

  const handleConfirmRevision = () => {
    if (!revisionNote.trim() || !selectedRequest) {
      alert("Catatan revisi wajib diisi!");
      return;
    }
    onAction(selectedRequest.id, RequestStatus.REVISION, revisionNote);
    setIsRevisionModalOpen(false);
    setIsReviewModalOpen(false);
    setSelectedRequest(null);
    setRevisionNote('');
  };

  const handleDirectApprove = () => {
    if (selectedRequest) {
      onAction(selectedRequest.id, RequestStatus.APPROVED_FINAL, ppkNote);
      setIsReviewModalOpen(false);
      setSelectedRequest(null);
      setPpkNote('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  };

  const openPdfInNewTab = (data: string) => {
    if (data.startsWith('http://') || data.startsWith('https://')) {
      window.open(data, '_blank');
      return;
    }
    try {
      const byteCharacters = atob(data);
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[150] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-10 duration-500">
          <div className="bg-white/20 p-2 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
          </div>
          <div>
            <p className="font-black uppercase text-xs tracking-widest">Berhasil!</p>
            <p className="text-sm font-bold">Usulan Bahan Telah Disetujui untuk Diproses</p>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {isReviewModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-100">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Persetujuan Final PPK</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Review Akhir Berkas Pengadaan</p>
                </div>
              </div>
              <button onClick={() => setIsReviewModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {/* Executive Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Informasi Pengajuan</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">Instruktur</span>
                      <span className="text-xs font-black text-slate-700 uppercase">{instructorNameMap[(selectedRequest.instructorName || '').toUpperCase()] || selectedRequest.instructorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">Kejuruan</span>
                      <span className="text-xs font-black text-slate-700 uppercase">{selectedRequest.vocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">Program</span>
                      <span className="text-xs font-black text-slate-700 uppercase">{selectedRequest.proglat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">Total Item</span>
                      <span className="text-xs font-black text-slate-700 uppercase">{selectedRequest.items.length} Barang</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Riwayat Verifikasi Bertingkat</h4>
                  <div className="space-y-4">
                    {/* Penyelenggara */}
                    <div className="space-y-2">
                       <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">1. Penyelenggara (Teknis)</p>
                       {selectedRequest.history?.filter(h => h.role === UserRole.ADMIN).map((log, i) => (
                         <div key={i} className="pl-3 border-l-2 border-blue-200">
                           <p className="text-[10px] font-bold text-slate-700">{log.action}</p>
                           {log.comment && <p className="text-[10px] text-slate-500 italic">"{log.comment}"</p>}
                         </div>
                       ))}
                    </div>
                    {/* TU */}
                    <div className="space-y-2">
                       <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest">2. Kasubag TU (Administrasi)</p>
                       {selectedRequest.history?.filter(h => h.role === UserRole.KASUBAG_TU).map((log, i) => (
                         <div key={i} className="pl-3 border-l-2 border-purple-200">
                           <p className="text-[10px] font-bold text-slate-700">{log.action}</p>
                           {log.comment && <p className="text-[10px] text-slate-500 italic">"{log.comment}"</p>}
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Catatan Final Input */}
              <div className="bg-emerald-50/30 rounded-3xl p-6 border border-emerald-100 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Catatan Persetujuan PPK</h4>
                <textarea
                  rows={3}
                  value={ppkNote}
                  onChange={(e) => setPpkNote(e.target.value)}
                  placeholder="Contoh: Disetujui untuk pengadaan segera, Prioritas utama, dll..."
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-600 transition-all resize-none"
                />
              </div>

              {/* Document Review */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Review Dokumen Lampiran</h4>
                  {selectedRequest.attachmentData && (
                    <button 
                      onClick={() => openPdfInNewTab(selectedRequest.attachmentData!)}
                      className="text-[10px] font-black text-[#003399] uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all flex items-center gap-2"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      Buka di tab baru
                    </button>
                  )}
                </div>
                <div className="border-2 border-slate-100 rounded-[2rem] overflow-hidden bg-slate-50 h-[400px] relative">
                  {(selectedRequest.signedDocumentData || selectedRequest.attachmentData) ? (
                    <PDFPreview data={selectedRequest.signedDocumentData || selectedRequest.attachmentData!} />
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
                      
                      {(selectedRequest.signedDocumentData || selectedRequest.attachmentData) && (
                        <div className="flex gap-3">
                          <button 
                            onClick={() => openPdfInNewTab(selectedRequest.signedDocumentData || selectedRequest.attachmentData!)}
                            className="bg-[#003399] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg shadow-blue-100"
                          >
                            Buka di Tab Baru
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-end gap-4">
              <button onClick={() => setIsReviewModalOpen(false)} className="px-8 py-4 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50">Tutup</button>
              {!isArchiveView && (
                <>
                  <button 
                    onClick={handleOpenRevision}
                    className="bg-red-50 border-2 border-red-200 text-red-600 hover:bg-red-100 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                  >
                    Kembalikan (Revisi)
                  </button>
                  <button 
                    onClick={handleDirectApprove}
                    className="bg-[#003399] hover:bg-[#0d47a1] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Konfirmasi & Setujui Final
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="overflow-y-auto p-8 custom-scrollbar">
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">Catatan Revisi PPK</h3>
              <p className="text-slate-500 text-sm mb-6 italic">Berikan alasan pengembalian berkas.</p>
              <textarea
                rows={4}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="Contoh: Spesifikasi barang tidak sesuai, Harga melebihi pagu, dll..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-red-100 focus:border-red-400 transition-all resize-none mb-6"
              />
              <div className="flex gap-3">
                <button onClick={() => setIsRevisionModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50">Batal</button>
                <button onClick={handleConfirmRevision} className="flex-[2] bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-100 transition-all active:scale-95">Kirim Pengembalian</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end border-b-2 border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">PPK</h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Persetujuan Final & Eksekusi Pengadaan</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="text-right">
            <span className="text-3xl font-black text-emerald-600 leading-none">{ppkRequests.length}</span>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Siap Disetujui</p>
          </div>
          <div className="h-10 w-px bg-slate-100"></div>
          <div className="bg-emerald-50 p-2 rounded-xl">
             <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="min-w-[900px] w-full table-auto divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nama Instruktur</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Program Pelatihan</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tanggal</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Catatan Final</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {ppkRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="text-slate-300 italic flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="font-black uppercase tracking-[0.2em] text-[10px]">Semua Pengajuan Selesai Diproses</span>
                    </div>
                  </td>
                </tr>
              ) : ppkRequests.map((req, index) => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6 text-xs font-black text-slate-400">{(index + 1).toString().padStart(2, '0')}</td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-black text-slate-800 uppercase tracking-tight">
                      {instructorNameMap[(req.instructorName || '').toUpperCase()] || req.instructorName}
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase border mt-1 inline-block ${VOCATION_COLORS[req.vocation]}`}>
                      {req.vocation}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs font-bold text-slate-700">{req.trainingTitle}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{req.proglat}</div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-xs font-black text-slate-700">{formatSafeDate(req.dateSubmitted)}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{getSafeYear(req.dateSubmitted)}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="inline-block px-3 py-1 text-[9px] font-black rounded-xl uppercase tracking-widest border shadow-sm bg-purple-50 text-purple-700 border-purple-200">
                      {req.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="max-w-[150px] truncate text-[10px] font-bold text-slate-500 italic" title={req.tuComment}>
                      {req.tuComment ? `[TU]: ${req.tuComment}` : '-'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleOpenReview(req)}
                      className="text-[10px] font-black uppercase text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-600 px-6 py-3 rounded-xl transition-all tracking-[0.15em] border border-emerald-100 shadow-sm active:scale-95"
                    >
                      Review & Setujui
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Archive Section */}
      <div className="pt-10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200"></div>
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Arsip & Rekam Jejak Pengajuan</h3>
          <div className="h-px flex-1 bg-slate-200"></div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="min-w-[900px] w-full table-auto divide-y divide-slate-100">
              <thead className="bg-slate-50/30">
                <tr>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Unit Pelatihan</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Posisi Berkas</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tanggal</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Terakhir</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Catatan</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dokumen</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {ppkArchive.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic">
                      Belum ada riwayat pengajuan
                    </td>
                  </tr>
                ) : ppkArchive.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{req.trainingTitle}</div>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase border mt-1 inline-block ${VOCATION_COLORS[req.vocation]}`}>
                        {req.vocation}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-tighter">
                        {instructorNameMap[(req.instructorName || '').toUpperCase()] || req.instructorName}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Instruktur</div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-xs font-black text-slate-700">{formatSafeDate(req.dateSubmitted)}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{getSafeYear(req.dateSubmitted)}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-block px-3 py-1 text-[9px] font-black rounded-xl uppercase tracking-widest border shadow-sm bg-emerald-50 text-emerald-700 border-emerald-100">
                        {req.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="max-w-[200px] text-[10px] font-bold text-slate-500 italic leading-relaxed">
                        {req.ppkComment ? `[PPK]: ${req.ppkComment}` : (req.tuComment ? `[TU]: ${req.tuComment}` : '-')}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleOpenReview(req, true)}
                        className="text-[9px] font-black uppercase text-slate-500 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-all tracking-widest border border-slate-200"
                      >
                        Lihat Dokumen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PPKView;
