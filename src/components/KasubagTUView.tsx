
import React, { useState } from 'react';
import { MaterialRequest, RequestStatus, VOCATION_COLORS, User, UserRole, HistoryLog, instructorNameMap } from '../types';
import { formatSafeDateTime, getSafeYear } from '../lib/dateUtils';
import PDFPreview from './PDFPreview';
import TUManual from './TUManual';
import { ChevronLeft } from 'lucide-react';

interface KasubagTUViewProps {
  user: User;
  requests: MaterialRequest[];
  onAction: (id: string, status: RequestStatus, comment?: string, signedDocName?: string, signedDocData?: string) => void;
}

const KasubagTUView: React.FC<KasubagTUViewProps> = ({ user, requests, onAction }) => {
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [tuNote, setTuNote] = useState('');
  const [isArchiveView, setIsArchiveView] = useState(false);
  const [showTechnicalNotes, setShowTechnicalNotes] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedRequestForNote, setSelectedRequestForNote] = useState<MaterialRequest | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // TTE Upload States
  const [isTTEModalOpen, setIsTTEModalOpen] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const tuRequests = requests
    .filter(r => r.status === RequestStatus.APPROVED_TECHNICAL)
    .sort((a, b) => {
      const timeA = new Date(a.dateSubmitted || 0).getTime();
      const timeB = new Date(b.dateSubmitted || 0).getTime();
      return timeB - timeA;
    });
  // Separate archive to show all history, sorted by newest first
  const tuArchive = [...requests].sort((a, b) => {
    const timeA = new Date(a.dateSubmitted || 0).getTime();
    const timeB = new Date(b.dateSubmitted || 0).getTime();
    return timeB - timeA;
  });

  // Body Scroll Lock for Modals
  React.useEffect(() => {
    if (isTTEModalOpen || isDetailModalOpen || isRevisionModalOpen || isNoteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isTTEModalOpen, isDetailModalOpen, isRevisionModalOpen, isNoteModalOpen]);

  const openNoteModal = (req: MaterialRequest) => {
    setSelectedRequestForNote(req);
    setIsNoteModalOpen(true);
  };

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
      setIsSubmitting(true);
      try {
        const base64 = await readFileAsBase64(uploadedDoc);
        if (base64.length > 48000) {
          alert("Peringatan: Ukuran file TTE cukup besar. Google Sheets memiliki batas 50.000 karakter per sel. Jika file tidak muncul di pratinjau nantinya, silakan kompres PDF Anda.");
        }
        await onAction(selectedRequest.id, RequestStatus.APPROVED_ADMIN, tuNote, uploadedDoc.name, base64);
        setIsSubmitting(false);
        setIsTTEModalOpen(false);
        setIsDetailModalOpen(false);
        setSelectedRequest(null);
        setTuNote('');
        
        setSuccessMessage("Berhasil dikirim! Dokumen diteruskan ke PPK.");
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      } catch (e) {
        setIsSubmitting(false);
        console.error(e);
        alert("Gagal memproses dokumen.");
      }
    }
  };

  const openPdfInNewTab = (data: string) => {
    if (data.startsWith('http://') || data.startsWith('https://')) {
      window.open(data, '_blank');
      return;
    }
    try {
      let base64Data = data;
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
      }
      base64Data = base64Data.replace(/\s/g, '');
      
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

  const handleConfirmRevision = async () => {
    if (!revisionNote.trim() || !selectedRequest) {
      alert("Catatan revisi wajib diisi!");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onAction(selectedRequest.id, RequestStatus.REVISION_FROM_TU, revisionNote);
      setIsSubmitting(false);
      setIsRevisionModalOpen(false);
      setIsDetailModalOpen(false);
      setSelectedRequest(null);
      setRevisionNote('');
      
      setSuccessMessage("Revisi berhasil dikirim ke Penyelenggara.");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (e) {
      setIsSubmitting(false);
      alert("Gagal mengirim revisi. Silakan coba lagi.");
    }
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
                    Verifikasi: {selectedRequest.trainingTitle}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {instructorNameMap[(selectedRequest.instructorName || '').toUpperCase()] || selectedRequest.instructorName}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {/* Program Pelatihan */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Program Pelatihan</h4>
                <div className="text-sm font-black text-slate-900">
                  {selectedRequest.trainingTitle}
                </div>
              </div>

              {/* Riwayat Catatan */}
              {(() => {
                const hasNotes = (selectedRequest.organizerComment && selectedRequest.organizerComment !== '-') || 
                                 (selectedRequest.tuComment && selectedRequest.tuComment !== '-') || 
                                 (selectedRequest.ppkComment && selectedRequest.ppkComment !== '-') || 
                                 (selectedRequest.instructorNotes && selectedRequest.instructorNotes !== '-') ||
                                 (selectedRequest.notes && selectedRequest.notes !== '-' && selectedRequest.notes !== selectedRequest.trainingTitle && selectedRequest.notes !== selectedRequest.proglat) || 
                                 (selectedRequest.history && selectedRequest.history.some(h => h.comment && h.comment !== '-'));
                                 
                if (!hasNotes) return null;

                return (
                  <div className="space-y-4">
                    <button 
                      onClick={() => setShowTechnicalNotes(!showTechnicalNotes)}
                      className="flex items-center gap-2 text-[10px] font-black text-[#003399] uppercase tracking-widest bg-blue-50 px-6 py-3 rounded-xl hover:bg-blue-100 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      {showTechnicalNotes ? 'Sembunyikan Riwayat Catatan' : 'Lihat Riwayat Catatan'}
                    </button>

                    {showTechnicalNotes && (
                      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 animate-in slide-in-from-top-2 duration-300 max-h-[300px] overflow-y-auto custom-scrollbar">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Riwayat Catatan</h4>
                        <div className="space-y-3">
                          {selectedRequest.organizerComment && selectedRequest.organizerComment !== '-' && (
                            <div className="bg-blue-50 p-3 rounded-xl">
                              <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Penyelenggara</p>
                              <p className="text-[11px] font-bold text-slate-700 italic">"{selectedRequest.organizerComment}"</p>
                            </div>
                          )}
                          {selectedRequest.tuComment && selectedRequest.tuComment !== '-' && (
                            <div className="bg-purple-50 p-3 rounded-xl">
                              <p className="text-[9px] font-black text-purple-600 uppercase mb-1">Kasubag TU</p>
                              <p className="text-[11px] font-bold text-slate-700 italic">"{selectedRequest.tuComment}"</p>
                            </div>
                          )}
                          {selectedRequest.ppkComment && selectedRequest.ppkComment !== '-' && (
                            <div className="bg-emerald-50 p-3 rounded-xl">
                              <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">PPK</p>
                              <p className="text-[11px] font-bold text-slate-700 italic">"{selectedRequest.ppkComment}"</p>
                            </div>
                          )}
                          {(selectedRequest.instructorNotes || (selectedRequest.notes && selectedRequest.notes !== '-' && selectedRequest.notes !== selectedRequest.trainingTitle && selectedRequest.notes !== selectedRequest.proglat)) && (
                            <div className="bg-amber-50 p-3 rounded-xl">
                              <p className="text-[9px] font-black text-amber-600 uppercase mb-1">Instruktur</p>
                              <p className="text-[11px] font-bold text-slate-700 italic">"{selectedRequest.instructorNotes || selectedRequest.notes}"</p>
                            </div>
                          )}
                          {selectedRequest.history?.filter(h => h.comment && h.comment !== '-').slice().reverse().map((h, i) => (
                            <div key={i} className="bg-white p-3 rounded-xl border border-slate-200">
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-[9px] font-black text-slate-600 uppercase">{h.role}</p>
                                <p className="text-[8px] text-slate-400">{new Date(h.date || h.timestamp || Date.now()).toLocaleString('id-ID')}</p>
                              </div>
                              <p className="text-[11px] font-bold text-slate-700 italic">"{h.comment}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Catatan Administrasi Input */}
              {!isArchiveView && (
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
              )}

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
                  disabled={!isVerified || isSubmitting}
                  className={`flex-[2] ${!isVerified || isSubmitting ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-purple-700 hover:bg-purple-800 text-white shadow-xl shadow-purple-100'} px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      MEMPROSES...
                    </>
                  ) : (
                    "Konfirmasi dan Teruskan"
                  )}
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
                <button 
                  onClick={handleConfirmRevision} 
                  disabled={isSubmitting}
                  className={`flex-[2] ${isSubmitting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-100 transition-all flex items-center justify-center gap-2`}
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
                    "KIRIM REVISI"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isManualModalOpen ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Panduan Sistem TU</h2>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Langkah-langkah verifikasi administrasi</p>
            </div>
            <button
              onClick={() => setIsManualModalOpen(false)}
              className="flex items-center gap-2 text-slate-500 hover:text-[#003399] transition-colors font-black uppercase text-xs tracking-widest bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm active:scale-95"
            >
              <ChevronLeft size={20} />
              Kembali
            </button>
          </div>
          <TUManual />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-end border-b-2 border-slate-200 pb-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">KASUBAG TU</h2>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Pemeriksaan Kelengkapan Administrasi</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="bg-white hover:bg-slate-50 text-[#003399] px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all border border-[#003399] shadow-sm active:scale-95 h-fit mb-1"
              >
                Panduan Sistem
              </button>
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
                <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
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
                    <div className="text-xs font-bold text-slate-700">{(req.trainingTitle && req.trainingTitle !== '-') ? req.trainingTitle : (req.proglat || req.programPelatihan || '-')}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{(req.trainingTitle && req.trainingTitle !== '-' && req.proglat && req.proglat !== req.trainingTitle) ? req.proglat : (req.trainingType || '-')}</div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-xs font-black text-slate-700">{formatSafeDateTime(req.dateSubmitted)}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{getSafeYear(req.dateSubmitted)}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                      <span className="inline-block px-3 py-1.5 text-[9px] font-semibold rounded-xl uppercase tracking-widest border shadow-sm bg-blue-50 text-blue-700 border-blue-200 min-w-[150px] text-center">
                        {req.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="max-w-[150px] text-[10px] font-bold text-slate-500 italic leading-relaxed">
                      {(() => {
                        const comments = [];
                        if (req.ppkComment && req.ppkComment !== '-') comments.push(`[PPK]: ${req.ppkComment}`);
                        if (req.tuComment && req.tuComment !== '-') comments.push(`[TU]: ${req.tuComment}`);
                        if (req.organizerComment && req.organizerComment !== '-') comments.push(`[Penyelenggara]: ${req.organizerComment}`);
                        if (req.notes && req.notes !== '-' && req.notes !== req.trainingTitle) comments.push(`[Instruktur]: ${req.notes}`);
                        
                        if (comments.length === 0) return '-';
                        return comments.map((c, i) => (
                          <div key={i} className={i > 0 ? "mt-1 pt-1 border-t border-slate-100" : ""}>{c}</div>
                        ));
                      })()}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleOpenDetail(req)}
                      className="text-[10px] font-black uppercase text-[#003399] hover:text-white bg-blue-50 hover:bg-[#003399] px-6 py-3 rounded-xl transition-all tracking-[0.15em] border border-blue-100 shadow-sm active:scale-95"
                    >
                      Verifikasi
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
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Program Pelatihan</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Posisi Berkas</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tanggal</th>
                  <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Terakhir</th>
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
                      <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{(req.trainingTitle && req.trainingTitle !== '-') ? req.trainingTitle : (req.proglat || req.programPelatihan || '-')}</div>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase border mt-1 inline-block ${VOCATION_COLORS[req.vocation || req.kejuruan] || 'bg-slate-100'}`}>
                        {req.vocation || req.kejuruan || '-'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-tighter">
                        {instructorNameMap[(req.instructorName || '').toUpperCase()] || req.instructorName}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Instruktur</div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-xs font-black text-slate-700">{formatSafeDateTime(req.dateSubmitted)}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{getSafeYear(req.dateSubmitted)}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        <span className={`inline-block px-3 py-1.5 text-[9px] font-semibold rounded-xl uppercase tracking-widest border shadow-sm min-w-[150px] text-center ${
                          (req.status === RequestStatus.REVISION || req.status === RequestStatus.REVISION_TO_ORGANIZER || req.status === RequestStatus.REVISION_FROM_TU || req.status === RequestStatus.REVISION_FROM_PPK) ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="max-w-[200px] text-[10px] font-bold text-slate-500 italic leading-relaxed">
                          {(() => {
                            const comments = [];
                            if (req.ppkComment && req.ppkComment !== '-') comments.push(`[PPK]: ${req.ppkComment}`);
                            if (req.tuComment && req.tuComment !== '-') comments.push(`[TU]: ${req.tuComment}`);
                            if (req.organizerComment && req.organizerComment !== '-') comments.push(`[Penyelenggara]: ${req.organizerComment}`);
                            if (req.instructorNotes && req.instructorNotes !== '-') comments.push(`[Instruktur]: ${req.instructorNotes}`);
                            else if (req.notes && req.notes !== '-' && req.notes !== req.trainingTitle) comments.push(`[Instruktur]: ${req.notes}`);
                            
                            if (comments.length === 0) return '-';
                            return comments.map((c, i) => (
                              <div key={i} className={i > 0 ? "mt-1 pt-1 border-t border-slate-100" : ""}>{c}</div>
                            ));
                          })()}
                        </div>
                        {(req.organizerComment || req.tuComment || req.ppkComment || (req.history && req.history.some(h => h.comment))) && (
                          <button 
                            onClick={() => openNoteModal(req)}
                            className="text-[8px] font-black uppercase text-amber-600 hover:text-white bg-amber-50 hover:bg-amber-600 px-2 py-1 rounded transition-all border border-amber-100 flex-shrink-0"
                          >
                            Detail
                          </button>
                        )}
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
      {/* Success Toast */}
      {/* Note History Modal */}
      {isNoteModalOpen && selectedRequestForNote && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Riwayat Catatan</h3>
                <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {(() => {
                  const primary = selectedRequestForNote.organizerComment;
                  const comment = (primary && primary !== '-' && primary !== '') 
                    ? primary 
                    : selectedRequestForNote.history?.filter(h => h.role === UserRole.ADMIN && h.comment && h.comment !== '-').pop()?.comment;
                  
                  if (!comment || comment === '-') return null;
                  return (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-2xl">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Penyelenggara (Teknis)</p>
                      <p className="text-sm text-slate-700 font-bold italic">"{comment}"</p>
                    </div>
                  );
                })()}

                {(() => {
                  const primary = selectedRequestForNote.tuComment;
                  const comment = (primary && primary !== '-' && primary !== '') 
                    ? primary 
                    : selectedRequestForNote.history?.filter(h => h.role === UserRole.KASUBAG_TU && h.comment && h.comment !== '-').pop()?.comment;
                  
                  if (!comment || comment === '-') return null;
                  return (
                    <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-2xl">
                      <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Kasubag TU (Administrasi)</p>
                      <p className="text-sm text-slate-700 font-bold italic">"{comment}"</p>
                    </div>
                  );
                })()}

                {(() => {
                  const primary = selectedRequestForNote.ppkComment;
                  const comment = (primary && primary !== '-' && primary !== '') 
                    ? primary 
                    : selectedRequestForNote.history?.filter(h => h.role === UserRole.PPK && h.comment && h.comment !== '-').pop()?.comment;
                  
                  if (!comment || comment === '-') return null;
                  return (
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-2xl">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">PPK (Final)</p>
                      <p className="text-sm text-slate-700 font-bold italic">"{comment}"</p>
                    </div>
                  );
                })()}

                {(selectedRequestForNote.instructorNotes || (selectedRequestForNote.notes && selectedRequestForNote.notes !== selectedRequestForNote.trainingTitle && selectedRequestForNote.notes !== selectedRequestForNote.proglat && selectedRequestForNote.notes !== '-')) && (
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Catatan Instruktur</p>
                    <p className="text-sm text-slate-700 font-bold italic">"{selectedRequestForNote.instructorNotes || selectedRequestForNote.notes}"</p>
                  </div>
                )}

                {/* Activity Log Section */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Log Aktivitas Catatan</p>
                  <div className="space-y-3">
                    {selectedRequestForNote.history?.filter(h => h.comment && h.comment !== '-').slice().reverse().map((h, i) => (
                      <div key={i} className="flex gap-3 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="w-2 h-2 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-black text-slate-700 uppercase text-[9px] mb-1">{h.role}</p>
                          <p className="font-bold text-slate-600 italic">"{h.comment}"</p>
                          <p className="text-[9px] text-slate-400 mt-1">{new Date(h.date || h.timestamp || Date.now()).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    ))}
                    {(!selectedRequestForNote.history || selectedRequestForNote.history.filter(h => h.comment && h.comment !== '-').length === 0) && (
                      <p className="text-[10px] text-slate-400 italic text-center py-2">Tidak ada log aktivitas.</p>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsNoteModalOpen(false)}
                className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

        </>
      )}

      {showSuccessToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-bounce">
          <div className="bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-emerald-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-black uppercase tracking-widest">{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KasubagTUView;
