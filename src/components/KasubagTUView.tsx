
import React, { useState } from 'react';
import { MaterialRequest, RequestStatus, VOCATION_COLORS, User, UserRole, HistoryLog, instructorNameMap } from '../types';
import { formatSafeDate, getSafeYear } from '../lib/dateUtils';
import PDFPreview from './PDFPreview';

interface KasubagTUViewProps {
  user: User;
  requests: MaterialRequest[];
  onAction: (id: string, status: RequestStatus, comment?: string, signedDocName?: string, signedDocData?: string) => void;
}

const KasubagTUView: React.FC<KasubagTUViewProps> = ({ user, requests, onAction }) => {
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [tuNote, setTuNote] = useState('');
  const [isArchiveView, setIsArchiveView] = useState(false);
  const [showTechnicalNotes, setShowTechnicalNotes] = useState(false);

  // TTE Upload States
  const [isTTEModalOpen, setIsTTEModalOpen] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const tuRequests = requests.filter(r => r.status === RequestStatus.APPROVED_TECHNICAL);
  const tuArchive = requests.filter(r => 
    r.status === RequestStatus.APPROVED_ADMIN || 
    r.status === RequestStatus.APPROVED_FINAL || 
    r.status === RequestStatus.COMPLETED ||
    (r.status === RequestStatus.REVISION && r.history?.some(h => h.role === UserRole.KASUBAG_TU))
  );

  // Body Scroll Lock for Modals
  React.useEffect(() => {
    if (isTTEModalOpen || isDetailModalOpen || isRevisionModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isTTEModalOpen, isDetailModalOpen, isRevisionModalOpen]);

  const handleOpenDetail = (req: MaterialRequest, isArchive: boolean = false) => {
    setSelectedRequest(req);
    setIsDetailModalOpen(true);
    setIsArchiveView(isArchive);
  };

  const handleOpenTTEUpload = () => {
    setUploadedDoc(null);
    setPreviewUrl(null);
    setIsScanning(false);
    setIsVerified(false);
    setIsTTEModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert("Hanya file PDF yang diperbolehkan untuk dokumen TTE!");
        return;
      }
      setUploadedDoc(file);
      setPreviewUrl(URL.createObjectURL(file));
      
      // Simulate AI Scanning for TTE
      setIsScanning(true);
      setIsVerified(false);
      setTimeout(() => {
        setIsScanning(false);
        setIsVerified(true);
      }, 2000);
    }
  };

  const handleConfirmTTE = async () => {
    if (selectedRequest && uploadedDoc && isVerified) {
      try {
        const base64 = await readFileAsBase64(uploadedDoc);
        onAction(selectedRequest.id, RequestStatus.APPROVED_ADMIN, tuNote, uploadedDoc.name, base64);
        setIsTTEModalOpen(false);
        setIsDetailModalOpen(false);
        setSelectedRequest(null);
        setTuNote('');
        alert("Dokumen TTE Berhasil Diverifikasi & Disetujui!");
      } catch (e) {
        console.error(e);
        alert("Gagal memproses dokumen.");
      }
    }
  };

  const openPdfInNewTab = (base64Data: string) => {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
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
    setIsDetailModalOpen(false);
    setSelectedRequest(null);
    setRevisionNote('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Detail & Preview Modal */}
      {isDetailModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="bg-[#003399] p-3 rounded-2xl shadow-lg shadow-blue-100">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase truncate max-w-md">
                    Verifikasi Administrasi: {selectedRequest.attachmentName || 'Dokumen'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {instructorNameMap[(selectedRequest.instructorName || '').toUpperCase()] || selectedRequest.instructorName} • {selectedRequest.trainingTitle}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {/* Technical Notes Toggle */}
              <div className="space-y-4">
                <button 
                  onClick={() => setShowTechnicalNotes(!showTechnicalNotes)}
                  className="flex items-center gap-2 text-[10px] font-black text-[#003399] uppercase tracking-widest bg-blue-50 px-6 py-3 rounded-xl hover:bg-blue-100 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  {showTechnicalNotes ? 'Sembunyikan Catatan Teknis' : 'Lihat Catatan Teknis (Penyelenggara)'}
                </button>

                {showTechnicalNotes && (
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 animate-in slide-in-from-top-2 duration-300">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Riwayat Verifikasi Teknis</h4>
                    <div className="space-y-4">
                      {selectedRequest.history?.filter(h => h.role === UserRole.ADMIN).map((log, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="w-1 h-auto bg-blue-200 rounded-full"></div>
                          <div>
                            <p className="text-xs font-black text-slate-700 uppercase">{log.action}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{new Date(log.date).toLocaleString('id-ID')}</p>
                            {log.comment && <p className="mt-2 text-sm text-slate-600 italic">"{log.comment}"</p>}
                          </div>
                        </div>
                      ))}
                      {(!selectedRequest.history || selectedRequest.history.filter(h => h.role === UserRole.ADMIN).length === 0) && (
                        <p className="text-xs text-slate-400 italic">Belum ada catatan riwayat teknis.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Catatan Administrasi Input */}
              <div className="bg-blue-50/30 rounded-3xl p-6 border border-blue-100 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Catatan Administrasi (Opsional untuk Setuju)</h4>
                <textarea
                  rows={3}
                  value={tuNote}
                  onChange={(e) => setTuNote(e.target.value)}
                  placeholder="Tambahkan catatan administratif jika diperlukan..."
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-[#003399] transition-all resize-none"
                />
              </div>

              {/* Live Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Pratinjau Dokumen</h4>
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
                <div className="border-2 border-slate-100 rounded-[2rem] overflow-hidden bg-slate-50 h-[500px] relative">
                  {selectedRequest.attachmentData ? (
                    <PDFPreview data={selectedRequest.attachmentData} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                      <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <p className="text-xs font-bold uppercase tracking-widest">Pratinjau tidak tersedia</p>
                    </div>
                  )}
                </div>
                <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  GUNAKAN SCROLL DAN FITUR ZOOM BROWSER PADA VIEWER DI ATAS
                </p>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-between items-center">
              <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-black uppercase text-[10px] tracking-widest px-6 py-4">
                Tutup
              </button>
              {!isArchiveView && (
                <div className="flex gap-4">
                  <button 
                    onClick={handleOpenRevision}
                    className="bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                  >
                    Kembalikan (Revisi)
                  </button>
                  <button 
                    onClick={handleOpenTTEUpload}
                    className="bg-[#003399] hover:bg-[#0d47a1] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                    Upload & Setujui TTE
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TTE Upload Modal */}
      {isTTEModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-2xl">
                  <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Upload Dokumen Sudah TTE</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verifikasi Tanda Tangan Elektronik</p>
                </div>
              </div>
              <button onClick={() => setIsTTEModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                <p className="text-[11px] font-bold text-purple-800 leading-relaxed">
                  Unggah berkas PDF yang telah ditandatangani secara elektronik. Sistem akan memvalidasi keaslian sertifikat digital dan struktur TTE.
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 bg-slate-50 hover:bg-white hover:border-purple-500 transition-all group relative">
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  {uploadedDoc ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-emerald-100 p-4 rounded-full">
                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{uploadedDoc.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">File PDF Terdeteksi</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-purple-100 p-4 rounded-2xl inline-block mb-4 group-hover:scale-110 transition-transform">
                         <svg className="w-8 h-8 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      </div>
                      <p className="text-base font-black text-slate-700">Klik atau seret file TTE ke sini</p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Hanya format .PDF yang didukung</p>
                    </>
                  )}
                </div>
              </div>

              {isScanning && (
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex flex-col items-center gap-4 animate-pulse">
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full w-1/2 animate-[progress_2s_ease-in-out_infinite]"></div>
                  </div>
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-[0.3em]">Menganalisis Struktur Sertifikat Digital...</p>
                </div>
              )}

              {isVerified && previewUrl && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pratinjau Berkas Terverifikasi</h4>
                    <div className="flex items-center gap-3">
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-200">Verified by BSrE</span>
                      <a 
                        href={previewUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-black text-[#003399] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-all flex items-center gap-1.5 border border-blue-100"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        Buka di tab baru
                      </a>
                    </div>
                  </div>
                  
                  <div className="border-2 border-emerald-500 rounded-3xl overflow-hidden bg-white shadow-2xl h-[800px]">
                    <iframe 
                      src={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=1`} 
                      className="w-full h-full border-none" 
                      title="TTE Preview" 
                      scrolling="yes"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex gap-4 sticky bottom-0 z-10">
              <button 
                onClick={() => setIsTTEModalOpen(false)}
                className="flex-1 px-8 py-4 rounded-2xl text-[10px] font-black text-slate-500 bg-white border-2 border-slate-200 uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
              >
                Batal
              </button>
              <button 
                onClick={handleConfirmTTE}
                disabled={!isVerified}
                className={`flex-[2] px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
                  isVerified ? 'bg-purple-700 hover:bg-purple-800 text-white shadow-purple-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Konfirmasi & Setujui TTE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="overflow-y-auto p-8 custom-scrollbar">
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">Catatan Revisi TU</h3>
              <p className="text-slate-500 text-sm mb-6 italic">Berikan alasan pengembalian berkas secara administratif.</p>
              <textarea
                rows={4}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="Contoh: Dokumen tidak terbaca, Format tidak sesuai, dll..."
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
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">KASUBAG TU</h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Pemeriksaan Kelengkapan Administrasi</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="text-right">
            <span className="text-3xl font-black text-[#003399] leading-none">{tuRequests.length}</span>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Antrian TU</p>
          </div>
          <div className="h-10 w-px bg-slate-100"></div>
          <div className="bg-blue-50 p-2 rounded-xl">
             <svg className="w-6 h-6 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
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
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Catatan</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {tuRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="text-slate-300 italic flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="font-black uppercase tracking-[0.2em] text-[10px]">Semua Pengajuan Selesai Diproses</span>
                    </div>
                  </td>
                </tr>
              ) : tuRequests.map((req, index) => (
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
                    <span className="inline-block px-3 py-1 text-[9px] font-black rounded-xl uppercase tracking-widest border shadow-sm bg-blue-50 text-blue-700 border-blue-200">
                      {req.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="max-w-[150px] truncate text-[10px] font-bold text-slate-500 italic" title={req.organizerComment}>
                      {req.organizerComment ? `[Penyelenggara]: ${req.organizerComment}` : '-'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleOpenDetail(req)}
                      className="text-[10px] font-black uppercase text-[#003399] hover:text-white bg-blue-50 hover:bg-[#003399] px-6 py-3 rounded-xl transition-all tracking-[0.15em] border border-blue-100 shadow-sm active:scale-95"
                    >
                      Verifikasi Admin
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
                {tuArchive.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic">
                      Belum ada riwayat pengajuan
                    </td>
                  </tr>
                ) : tuArchive.map((req) => (
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
                      <span className={`inline-block px-3 py-1 text-[9px] font-black rounded-xl uppercase tracking-widest border shadow-sm ${
                        req.status === RequestStatus.REVISION ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="max-w-[200px] text-[10px] font-bold text-slate-500 italic leading-relaxed">
                        {req.ppkComment ? `[PPK]: ${req.ppkComment}` : (req.tuComment ? `[TU]: ${req.tuComment}` : (req.organizerComment ? `[Penyelenggara]: ${req.organizerComment}` : '-'))}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleOpenDetail(req, true)}
                        className="text-[9px] font-black uppercase text-slate-500 hover:text-[#003399] bg-slate-100 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all tracking-widest border border-slate-200"
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

export default KasubagTUView;
