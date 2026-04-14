
import React, { useState } from 'react';
import { MaterialRequest, RequestStatus, VOCATION_COLORS, MaterialItem, instructorNameMap, UserRole } from '../types';

interface OrganizerViewProps {
  requests: MaterialRequest[];
  onAction: (id: string, status: RequestStatus, comment?: string, signedDocName?: string, signedDocData?: string) => void;
}

const OrganizerView: React.FC<OrganizerViewProps> = ({ requests, onAction }) => {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [isTTEModalOpen, setIsTTEModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedRequestForNote, setSelectedRequestForNote] = useState<MaterialRequest | null>(null);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewItems, setPreviewItems] = useState<MaterialItem[]>([]);
  const [previewData, setPreviewData] = useState<string | undefined>(undefined);

  // Body Scroll Lock & Escape Key
  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsApprovalModalOpen(false);
        setIsPreviewModalOpen(false);
        setIsRevisionModalOpen(false);
      }
    };

    if (isApprovalModalOpen || isPreviewModalOpen || isRevisionModalOpen || isTTEModalOpen || isNoteModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isApprovalModalOpen, isPreviewModalOpen, isRevisionModalOpen, isTTEModalOpen, isNoteModalOpen]);

  const getLatestComment = (req: MaterialRequest) => {
    if (req.ppkComment) return `[PPK]: ${req.ppkComment}`;
    if (req.tuComment) return `[TU]: ${req.tuComment}`;
    if (req.organizerComment) return `[Penyelenggara]: ${req.organizerComment}`;
    return null;
  };

  const openNoteModal = (req: MaterialRequest) => {
    setSelectedRequestForNote(req);
    setIsNoteModalOpen(true);
  };

  const pendingRequests = requests.filter(r => 
    r.status === RequestStatus.PENDING || 
    (r.status === RequestStatus.REVISION && r.history && r.history.length > 0 && 
     (r.history[r.history.length - 1].role === UserRole.KASUBAG_TU || 
      r.history[r.history.length - 1].role === UserRole.PPK))
  );
  const otherRequests = requests.filter(r => !pendingRequests.find(pr => pr.id === r.id));

  const handleOpenApproval = (req: any) => {
    setSelectedRequestId(req.id);
    setUploadedDoc(null);
    
    // Create preview URL if attachment data exists
    let url = null;
    if (req.attachmentData) {
      const byteCharacters = atob(req.attachmentData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);
    }
    
    setPreviewUrl(url);
    setPreviewData(req.attachmentData || null);
    setIsScanning(false);
    setIsVerified(false);
    setIsApprovalModalOpen(true);
  };

  const handleOpenRevision = (id: string) => {
    setSelectedRequestId(id);
    setRevisionNote('');
    setIsRevisionModalOpen(true);
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

  const handleOpenPreview = (fileName: string, items: MaterialItem[], attachmentData?: string) => {
    setPreviewFileName(fileName);
    setPreviewItems(items);
    setPreviewData(attachmentData);
    setIsPreviewModalOpen(true);
  };

  const handleOpenTTE = () => {
    setUploadedDoc(null);
    setPreviewUrl(null);
    setIsScanning(false);
    setIsVerified(false);
    setIsTTEModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validasi PDF
      if (selectedFile.type !== 'application/pdf') {
        alert("Mohon unggah file dalam format PDF yang sudah memiliki TTE.");
        return;
      }

      setUploadedDoc(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);

      // Simulasi AI Scanning TTE
      setIsScanning(true);
      setIsVerified(false);
      
      setTimeout(() => {
        setIsScanning(false);
        setIsVerified(true);
      }, 2000);
    }
  };

  const handleConfirmForward = async () => {
    if (!uploadedDoc || !selectedRequestId || !isVerified) {
      alert("Silakan upload dokumen yang sudah ditandatangani dan tunggu verifikasi!");
      return;
    }
    
    try {
      const base64 = await readFileAsBase64(uploadedDoc);
      onAction(selectedRequestId, RequestStatus.APPROVED_TECHNICAL, undefined, uploadedDoc.name, base64);
      
      // Reset and close all modals
      setIsTTEModalOpen(false);
      setIsApprovalModalOpen(false);
      setSelectedRequestId(null);
      setUploadedDoc(null);
      setPreviewUrl(null);
      setIsVerified(false);
      
      alert("Dokumen bertanda tangan berhasil diunggah. Pengajuan diteruskan ke TU.");
    } catch (e) {
      console.error(e);
      alert("Gagal memproses dokumen. Silakan coba lagi.");
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

  const handleConfirmRevision = () => {
    if (!revisionNote.trim() || !selectedRequestId) {
      alert("Catatan perbaikan wajib diisi!");
      return;
    }
    onAction(selectedRequestId, RequestStatus.REVISION, revisionNote);
    setIsRevisionModalOpen(false);
    setSelectedRequestId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Note Modal */}
      {isNoteModalOpen && selectedRequestForNote && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-amber-100 p-3 rounded-2xl">
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">Catatan Pengajuan</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Berikut adalah riwayat catatan koordinasi untuk pengajuan ini.
              </p>

              <div className="space-y-4">
                {selectedRequestForNote.organizerComment && (
                  <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Penyelenggara</div>
                    <p className="text-sm font-bold text-slate-700 italic">"{selectedRequestForNote.organizerComment}"</p>
                  </div>
                )}
                {selectedRequestForNote.tuComment && (
                  <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-100">
                    <div className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2">Kasubag TU</div>
                    <p className="text-sm font-bold text-slate-700 italic">"{selectedRequestForNote.tuComment}"</p>
                  </div>
                )}
                {selectedRequestForNote.ppkComment && (
                  <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100">
                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">PPK</div>
                    <p className="text-sm font-bold text-slate-700 italic">"{selectedRequestForNote.ppkComment}"</p>
                  </div>
                )}
                {!selectedRequestForNote.organizerComment && !selectedRequestForNote.tuComment && !selectedRequestForNote.ppkComment && (
                  <div className="text-center py-8 text-slate-400 italic text-sm font-bold uppercase tracking-widest">Tidak ada catatan</div>
                )}
              </div>

              <button 
                onClick={() => setIsNoteModalOpen(false)}
                className="w-full mt-8 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-slate-100"
              >
                Tutup Catatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="overflow-y-auto p-10 custom-scrollbar">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-2xl">
                      <svg className="w-8 h-8 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Preview Data Ajuan</h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{previewFileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {previewData && (
                      <a 
                        href={`data:application/pdf;base64,${previewData}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-black text-[#003399] uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all flex items-center gap-2"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        Buka di tab baru
                      </a>
                    )}
                    <button onClick={() => setIsPreviewModalOpen(false)} className="bg-slate-50 p-3 rounded-2xl hover:bg-slate-100 transition-colors">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>

              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100 mb-4">
                  <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">Data berhasil diekstraksi dari file yang diunggah.</span>
                </div>
                
                <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">No</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Barang</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Spesifikasi Teknis</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Satuan</th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {previewItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic text-xs font-bold uppercase tracking-widest">
                            Tidak ada data item yang ditemukan dalam berkas ini.
                          </td>
                        </tr>
                      ) : (
                        previewItems.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-slate-400">{(index + 1).toString().padStart(2, '0')}</td>
                            <td className="px-6 py-4 text-xs font-black text-slate-800 uppercase">{item.name}</td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-500 italic">{item.spec}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-600">{item.unit}</td>
                            <td className="px-6 py-4 text-center text-xs font-black text-[#003399]">{item.quantity}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end items-center gap-3 pt-6 border-t border-slate-50">
                {previewData && (
                  <a 
                    href={`data:application/pdf;base64,${previewData}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-blue-50 text-[#003399] hover:bg-blue-100 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    Buka di tab baru
                  </a>
                )}
                <button 
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="text-slate-500 hover:text-slate-700 bg-transparent hover:bg-slate-100 px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                >
                  Tutup Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TTE Upload Modal */}
      {isTTEModalOpen && selectedRequestId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
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
                    <a 
                      href={previewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] font-black text-[#003399] uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      Buka di tab baru
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    </a>
                  </div>
                  
                  <div className="border-2 border-emerald-500 rounded-3xl overflow-hidden bg-white shadow-2xl h-[500px]">
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
                onClick={handleConfirmForward}
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

      {/* Approval Modal */}
      {isApprovalModalOpen && selectedRequestId && (
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
                    Verifikasi Administrasi: {requests.find(r => r.id === selectedRequestId)?.attachmentName || 'Dokumen'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {instructorNameMap[(requests.find(r => r.id === selectedRequestId)?.instructorName || '').toUpperCase()] || requests.find(r => r.id === selectedRequestId)?.instructorName} • {requests.find(r => r.id === selectedRequestId)?.trainingTitle}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsApprovalModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {/* Catatan Administrasi Input */}
              <div className="bg-blue-50/30 rounded-3xl p-6 border border-blue-100 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Catatan Administrasi (Opsional untuk Setuju)</h4>
                <textarea
                  rows={3}
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="Tambahkan catatan administratif jika diperlukan..."
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-[#003399] transition-all resize-none"
                />
              </div>

              {/* Live Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Pratinjau Dokumen</h4>
                  <a 
                    href={previewUrl || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`text-[10px] font-black text-[#003399] uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${previewUrl ? 'hover:bg-blue-100' : 'opacity-50 cursor-not-allowed'}`}
                    onClick={(e) => !previewUrl && e.preventDefault()}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    BUKA DI TAB BARU
                  </a>
                </div>
                <div className="border-2 border-slate-100 rounded-[2rem] overflow-hidden bg-slate-50 h-[500px] relative">
                  {uploadedDoc ? (
                    <iframe 
                      src={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=1`} 
                      className="w-full h-full border-none" 
                      title="PDF Preview"
                    />
                  ) : previewData ? (
                    <iframe 
                      src={`data:application/pdf;base64,${previewData}#toolbar=1&navpanes=0&scrollbar=1`} 
                      className="w-full h-full border-none" 
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                      <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <p className="text-xs font-bold uppercase tracking-widest">Pratinjau tidak tersedia</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-between items-center">
              <button onClick={() => setIsApprovalModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-black uppercase text-[10px] tracking-widest px-6 py-4">
                Tutup
              </button>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setIsApprovalModalOpen(false);
                    setIsRevisionModalOpen(true);
                  }}
                  className="bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                >
                  Kembalikan (Revisi)
                </button>
                <button 
                  onClick={handleOpenTTE}
                  className="bg-[#003399] hover:bg-[#0d47a1] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                  UPLOAD & SETUJUI TTE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="overflow-y-auto p-8 custom-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-red-100 p-3 rounded-2xl">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <button onClick={() => setIsRevisionModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">Catatan Revisi Penyelenggara</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed italic">
                Berikan alasan pengembalian berkas secara teknis.
              </p>

              <div className="space-y-6">
                <div>
                  <textarea
                    required
                    rows={4}
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                    placeholder="Contoh: Dokumen tidak terbaca, Format tidak sesuai, dll..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-red-100 focus:border-red-400 transition-all resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsRevisionModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleConfirmRevision}
                    className="flex-[2] bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-100 transition-all active:scale-95"
                  >
                    Kirim Pengembalian
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-end border-b-2 border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">PENYELENGGARA</h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Validasi Administrasi Pengadaan</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right flex items-center gap-4 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
            <div>
              <span className="text-3xl font-black text-[#003399] leading-none">{pendingRequests.length}</span>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Antrian Baru</p>
            </div>
            <div className="h-10 w-px bg-slate-100"></div>
            <div className="bg-blue-50 p-2 rounded-xl">
               <svg className="w-6 h-6 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Catatan</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="text-slate-300 italic flex flex-col items-center gap-3">
                      <span className="font-black uppercase tracking-[0.2em] text-[10px]">Tidak ada antrian baru</span>
                    </div>
                  </td>
                </tr>
              ) : pendingRequests.map((req, index) => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6 text-xs font-black text-slate-400">{(index + 1).toString().padStart(2, '0')}</td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-black text-slate-800 uppercase tracking-tight">
                      {instructorNameMap[req.instructorName.toUpperCase()] || req.instructorName}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs font-bold text-slate-700">{req.trainingTitle}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{req.proglat}</div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-xs font-black text-slate-700">{new Date(req.dateSubmitted).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{new Date(req.dateSubmitted).getFullYear()}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-block px-3 py-1 text-[9px] font-black rounded-xl uppercase tracking-widest border shadow-sm ${req.status === RequestStatus.REVISION ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="max-w-[150px] truncate text-[10px] font-bold text-slate-500 italic" title={getLatestComment(req) || ''}>
                      {getLatestComment(req) || '-'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right flex gap-2 justify-end">
                    {(req.organizerComment || req.tuComment || req.ppkComment) && (
                      <button 
                        onClick={() => openNoteModal(req)}
                        className="text-[10px] font-black uppercase text-amber-600 hover:text-white bg-amber-50 hover:bg-amber-600 px-6 py-3 rounded-xl transition-all tracking-[0.15em] border border-amber-100 shadow-sm active:scale-95"
                      >
                        Lihat Catatan
                      </button>
                    )}
                    <button 
                      onClick={() => handleOpenApproval(req)}
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

      <div className="pt-16 mt-8 border-t-4 border-slate-200">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10 px-4 text-center">Arsip & Rekam Jejak Pengajuan</h3>
        <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] overflow-hidden shadow-lg">
          <div className="overflow-x-auto w-full">
            <table className="min-w-[1000px] w-full table-auto divide-y divide-slate-100">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-8 py-7 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Unit Pelatihan</th>
                <th className="px-8 py-7 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Posisi Berkas</th>
                <th className="px-8 py-7 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Tanggal</th>
                <th className="px-8 py-7 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest">Dokumen</th>
                <th className="px-8 py-7 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Status Terakhir</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {otherRequests.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic text-sm font-bold uppercase tracking-widest opacity-50">Belum ada riwayat berkas</td>
                </tr>
              ) : otherRequests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50 transition-all duration-300">
                  <td className="px-8 py-8">
                    <div className="text-base font-black text-slate-800 mb-2 uppercase tracking-tight">{req.trainingTitle}</div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] px-3 py-0.5 rounded-full font-black uppercase border tracking-widest ${VOCATION_COLORS[req.vocation]}`}>
                        {req.vocation}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 tracking-tight">{req.proglat}</span>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="flex flex-col gap-1.5">
                       <div className="text-sm text-slate-900 font-black uppercase tracking-tighter">
                         {req.status === RequestStatus.APPROVED_TECHNICAL ? 'Sistem Logistik (TU)' : (instructorNameMap[req.instructorName.toUpperCase()] || req.instructorName)}
                       </div>
                       {req.signedDocumentName && (
                         <div className="text-[10px] text-purple-600 font-black uppercase tracking-widest flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                           Tanda Tangan Terlampir
                         </div>
                       )}
                    </div>
                  </td>
                  <td className="px-8 py-8 whitespace-nowrap">
                    <div className="text-xs font-black text-slate-700">{new Date(req.dateSubmitted).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{new Date(req.dateSubmitted).getFullYear()}</div>
                  </td>
                  <td className="px-8 py-8 text-center">
                    <div className="flex flex-col gap-2 items-center">
                      <button 
                        onClick={() => handleOpenPreview(req.attachmentName || 'Dokumen', req.items, req.attachmentData)}
                        className="text-[9px] font-black uppercase text-[#003399] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-all tracking-widest border border-blue-100 w-full"
                      >
                        Lihat Dokumen
                      </button>
                      {(req.organizerComment || req.tuComment || req.ppkComment) && (
                        <button 
                          onClick={() => openNoteModal(req)}
                          className="text-[9px] font-black uppercase text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-lg transition-all tracking-widest border border-amber-100 w-full"
                        >
                          Lihat Catatan
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-8 text-right">
                    <span className={`inline-block px-3 py-1 text-[9px] font-black rounded-xl uppercase tracking-widest border shadow-sm whitespace-nowrap min-w-fit text-center ${
                      req.status === RequestStatus.APPROVED_FINAL ? 'bg-green-50 text-green-700 border-green-200' :
                      req.status === RequestStatus.PENDING ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      req.status === RequestStatus.REVISION ? 'bg-red-50 text-red-700 border-red-200' :
                      req.status === RequestStatus.APPROVED_TECHNICAL ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      req.status === RequestStatus.APPROVED_ADMIN ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {req.status}
                    </span>
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

export default OrganizerView;
