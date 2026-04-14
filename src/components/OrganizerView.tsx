
import React, { useState, useMemo } from 'react';
import { MaterialRequest, RequestStatus, VOCATION_COLORS, MaterialItem, instructorNameMap, UserRole } from '../types';
import { formatSafeDate, getSafeYear, formatSafeNumber } from '../lib/dateUtils';
import PDFPreview from './PDFPreview';
import SiberLogo from './SiberLogo';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Archive, 
  BarChart3, 
  Settings, 
  Search, 
  Filter, 
  ChevronLeft, 
  Menu,
  MoreVertical,
  User as UserIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrganizerViewProps {
  requests: MaterialRequest[];
  onAction: (id: string, status: RequestStatus, comment?: string, signedDocName?: string, signedDocData?: string) => void;
  onLogout: () => void;
}

const OrganizerView: React.FC<OrganizerViewProps> = ({ requests, onAction, onLogout }) => {
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'validation' | 'archive' | 'recap' | 'settings'>('validation');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [vocationFilter, setVocationFilter] = useState<string>('all');
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  
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
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
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

  const pendingRequests = useMemo(() => {
    return requests.filter(r => {
      const isPending = r.status === RequestStatus.PENDING || 
        (r.status === RequestStatus.REVISION && r.history && r.history.length > 0 && 
         (r.history[r.history.length - 1].role === UserRole.KASUBAG_TU || 
          r.history[r.history.length - 1].role === UserRole.PPK));
      
      if (!isPending) return false;

      const matchesSearch = 
        r.instructorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.trainingTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.proglat?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesVocation = vocationFilter === 'all' || r.vocation === vocationFilter;

      return matchesSearch && matchesVocation;
    });
  }, [requests, searchQuery, vocationFilter]);

  const otherRequests = useMemo(() => {
    return requests.filter(r => {
      const isOther = !requests.find(pr => pr.id === r.id && (
        pr.status === RequestStatus.PENDING || 
        (pr.status === RequestStatus.REVISION && pr.history && pr.history.length > 0 && 
         (pr.history[pr.history.length - 1].role === UserRole.KASUBAG_TU || 
          pr.history[pr.history.length - 1].role === UserRole.PPK))
      ));

      if (!isOther) return false;

      const matchesSearch = 
        r.instructorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.trainingTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.proglat?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesVocation = vocationFilter === 'all' || r.vocation === vocationFilter;

      return matchesSearch && matchesVocation;
    });
  }, [requests, searchQuery, vocationFilter]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === RequestStatus.PENDING).length,
      process: requests.filter(r => [RequestStatus.APPROVED_TECHNICAL, RequestStatus.APPROVED_ADMIN].includes(r.status)).length,
      done: requests.filter(r => r.status === RequestStatus.APPROVED_FINAL).length,
      revision: requests.filter(r => r.status === RequestStatus.REVISION).length
    };
  }, [requests]);

  const toggleSelectAll = () => {
    if (selectedRequestIds.length === pendingRequests.length) {
      setSelectedRequestIds([]);
    } else {
      setSelectedRequestIds(pendingRequests.map(r => r.id));
    }
  };

  const toggleSelectRequest = (id: string) => {
    if (selectedRequestIds.includes(id)) {
      setSelectedRequestIds(selectedRequestIds.filter(rid => rid !== id));
    } else {
      setSelectedRequestIds([...selectedRequestIds, id]);
    }
  };

  const handleOpenApproval = (req: any) => {
    setSelectedRequestId(req.id);
    setUploadedDoc(null);
    
    // Create preview URL if attachment data exists
    let url = null;
    if (req.attachmentData) {
      const data = req.attachmentData;
      if (data.startsWith('http://') || data.startsWith('https://')) {
        url = data;
      } else {
        try {
          const byteCharacters = atob(data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          url = URL.createObjectURL(blob);
        } catch (e) {
          console.error("Failed to create blob URL", e);
        }
      }
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
      if (base64.length > 48000) {
        alert("Peringatan: Ukuran file TTE cukup besar. Google Sheets memiliki batas 50.000 karakter per sel. Jika file tidak muncul di pratinjau nantinya, silakan kompres PDF Anda.");
      }
      onAction(selectedRequestId, RequestStatus.APPROVED_TECHNICAL, undefined, uploadedDoc.name, base64);
      
      // Reset and close all modals
      setIsTTEModalOpen(false);
      setIsApprovalModalOpen(false);
      setSelectedRequestId(null);
      setUploadedDoc(null);
      setPreviewUrl(null);
      setIsVerified(false);
      
      setSuccessMessage("Berhasil dikirim! Dokumen diteruskan ke TU.");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Gagal memproses dokumen. Silakan coba lagi.");
    }
  };

  const handleConfirmRevision = () => {
    if (!revisionNote.trim() || !selectedRequestId) {
      alert("Catatan revisi wajib diisi!");
      return;
    }
    onAction(selectedRequestId, RequestStatus.REVISION, revisionNote);
    setIsRevisionModalOpen(false);
    setIsApprovalModalOpen(false);
    setSelectedRequestId(null);
    setRevisionNote('');
    
    setSuccessMessage("Revisi berhasil dikirim ke Instruktur.");
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
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

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Usulan', value: stats.total, icon: FileText, color: 'blue' },
          { label: 'Antrian Baru', value: stats.pending, icon: Clock, color: 'amber' },
          { label: 'Sedang Proses', value: stats.process, icon: AlertCircle, color: 'purple' },
          { label: 'Selesai', value: stats.done, icon: CheckCircle2, color: 'emerald' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5"
          >
            <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">Aktivitas Terakhir</h3>
        <div className="space-y-4">
          {requests.slice(0, 5).map((req, i) => (
            <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <UserIcon size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{req.instructorName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{req.trainingTitle}</p>
                </div>
              </div>
              <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                req.status === RequestStatus.APPROVED_FINAL ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'
              }`}>
                {req.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderValidation = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Cari nama instruktur atau program..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-[#001F54] transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="text-slate-400" size={18} />
          <select 
            value={vocationFilter}
            onChange={(e) => setVocationFilter(e.target.value)}
            className="flex-1 md:flex-none bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-[#001F54] transition-all"
          >
            <option value="all">Semua Kejuruan</option>
            {Object.keys(VOCATION_COLORS).map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-5 text-left">
                  <input 
                    type="checkbox" 
                    checked={selectedRequestIds.length === pendingRequests.length && pendingRequests.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-[#001F54] focus:ring-[#001F54]"
                  />
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Instruktur</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Program</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">
                    Tidak ada antrian baru
                  </td>
                </tr>
              ) : pendingRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <input 
                      type="checkbox" 
                      checked={selectedRequestIds.includes(req.id)}
                      onChange={() => toggleSelectRequest(req.id)}
                      className="w-4 h-4 rounded border-slate-300 text-[#001F54] focus:ring-[#001F54]"
                    />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px]">
                        {req.instructorName?.charAt(0)}
                      </div>
                      <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                        {instructorNameMap[(req.instructorName || '').toUpperCase()] || req.instructorName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-bold text-slate-700">{req.trainingTitle}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{req.proglat}</div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-xs font-black text-slate-700">{formatSafeDate(req.dateSubmitted)}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <span className={`px-3 py-1.5 text-[9px] font-semibold rounded-full uppercase tracking-widest border min-w-[150px] text-center ${
                        req.status === RequestStatus.REVISION ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => handleOpenApproval(req)}
                      className="text-[10px] font-black uppercase text-[#001F54] hover:text-white bg-blue-50 hover:bg-[#001F54] px-4 py-2 rounded-xl transition-all tracking-widest border border-blue-100"
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
    </div>
  );

  const renderArchive = () => (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Arsip & Riwayat Pengajuan</h3>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text"
              placeholder="Cari arsip..."
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto divide-y divide-slate-100">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Pelatihan</th>
              <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Posisi</th>
              <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
              <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Berkas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {otherRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">
                  Belum ada riwayat
                </td>
              </tr>
            ) : otherRequests.map(req => (
              <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-6">
                  <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{req.trainingTitle}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase border tracking-widest ${VOCATION_COLORS[req.vocation]}`}>
                      {req.vocation}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="text-xs font-bold text-slate-600 uppercase">
                    {req.status === RequestStatus.APPROVED_TECHNICAL ? 'TU' : (instructorNameMap[(req.instructorName || '').toUpperCase()] || req.instructorName)}
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="text-xs font-black text-slate-700">{formatSafeDate(req.dateSubmitted)}</div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex justify-center">
                    <span className={`px-3 py-1.5 text-[9px] font-semibold rounded-full uppercase tracking-widest border min-w-[150px] text-center ${
                      req.status === RequestStatus.APPROVED_FINAL ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex flex-col gap-2 items-end">
                    {req.attachmentData && (
                      <button 
                        onClick={() => openPdfInNewTab(req.attachmentData!)}
                        className="text-[9px] font-black uppercase text-[#001F54] hover:text-white bg-blue-50 hover:bg-[#001F54] px-4 py-2 rounded-xl transition-all tracking-widest border border-blue-100 flex items-center gap-2"
                      >
                        <FileText size={12} />
                        Usulan
                      </button>
                    )}
                    {req.signedDocumentData && (
                      <button 
                        onClick={() => openPdfInNewTab(req.signedDocumentData!)}
                        className="text-[9px] font-black uppercase text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 px-4 py-2 rounded-xl transition-all tracking-widest border border-emerald-100 flex items-center gap-2"
                      >
                        <CheckCircle2 size={12} />
                        TTE
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderModals = () => (
    <>
      {/* Approval Modal */}
      {isApprovalModalOpen && selectedRequestId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="bg-[#001F54] p-3 rounded-2xl shadow-lg">
                  <ClipboardCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                    Verifikasi Teknis: {requests.find(r => r.id === selectedRequestId)?.instructorName}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {requests.find(r => r.id === selectedRequestId)?.trainingTitle}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsApprovalModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
                <Menu size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Daftar Barang Usulan</h4>
                    <div className="space-y-3">
                      {requests.find(r => r.id === selectedRequestId)?.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-700">{item.name}</span>
                          <span className="text-xs font-black text-[#001F54]">{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pratinjau Dokumen</h4>
                    <div className="border-2 border-slate-100 rounded-[2rem] overflow-hidden bg-slate-50 h-[400px] relative">
                      {previewUrl ? (
                        <PDFPreview data={previewUrl} />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                          <AlertCircle size={48} className="mb-4 opacity-20" />
                          <p className="text-xs font-black uppercase tracking-widest">Pratinjau Tidak Tersedia</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Aksi Verifikasi</h4>
                    <div className="space-y-4">
                      <button 
                        onClick={handleOpenTTE}
                        className="w-full bg-[#001F54] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-900/20 hover:bg-[#002d7a] transition-all"
                      >
                        Teruskan ke TU
                      </button>
                      <button 
                        onClick={() => handleOpenRevision(selectedRequestId)}
                        className="w-full bg-white border-2 border-red-100 text-red-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-50 transition-all"
                      >
                        Kembalikan (Revisi)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TTE Upload Modal */}
      {isTTEModalOpen && selectedRequestId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">Upload Dokumen TTE</h3>
              <p className="text-slate-500 text-sm mb-6 italic">Unggah berkas PDF yang telah ditandatangani secara elektronik.</p>
              
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 bg-slate-50 hover:bg-white hover:border-blue-500 transition-all group relative mb-6">
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
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                      </div>
                      <p className="text-sm font-black text-slate-800">{uploadedDoc.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Klik untuk mengganti berkas</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-blue-100 p-4 rounded-2xl inline-block mb-4 group-hover:scale-110 transition-transform">
                         <ClipboardCheck className="w-8 h-8 text-blue-700" />
                      </div>
                      <p className="text-base font-black text-slate-700">Klik atau seret file TTE ke sini</p>
                    </>
                  )}
                </div>
              </div>

              {isScanning && (
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex flex-col items-center gap-4 animate-pulse mb-6">
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full w-1/2 animate-[progress_2s_ease-in-out_infinite]"></div>
                  </div>
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Memverifikasi TTE...</p>
                </div>
              )}

              {uploadedDoc && previewUrl && (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Live Preview & Verifikasi Data</h4>
                  <div className="border-2 border-slate-100 rounded-[2rem] overflow-hidden bg-slate-50 h-[500px] relative">
                    <PDFPreview data={previewUrl} />
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsTTEModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50">Batal</button>
                <button 
                  onClick={handleConfirmForward} 
                  disabled={!isVerified}
                  className={`flex-[2] px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all ${
                    isVerified ? 'bg-[#001F54] text-white hover:bg-[#002d7a]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Konfirmasi & Teruskan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-8">
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">Catatan Revisi</h3>
              <p className="text-slate-500 text-sm mb-6 italic">Berikan alasan pengembalian berkas.</p>
              <textarea
                rows={4}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="Contoh: Spesifikasi barang tidak sesuai..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-red-100 focus:border-red-400 transition-all resize-none mb-6"
              />
              <div className="flex gap-3">
                <button onClick={() => setIsRevisionModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50">Batal</button>
                <button onClick={handleConfirmRevision} className="flex-[2] bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-100 transition-all">Kirim Revisi</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {isNoteModalOpen && selectedRequestForNote && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-amber-100 p-3 rounded-2xl">
                  <FileText className="w-8 h-8 text-amber-600" />
                </div>
                <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <Menu size={24} />
                </button>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">Catatan Pengajuan</h3>
              <div className="space-y-4 mt-6">
                {selectedRequestForNote.organizerComment && (
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Penyelenggara</p>
                    <p className="text-sm font-bold text-slate-700 italic">"{selectedRequestForNote.organizerComment}"</p>
                  </div>
                )}
                {/* ... other comments ... */}
              </div>
              <button onClick={() => setIsNoteModalOpen(false)} className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-10 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Preview Data Ajuan</h3>
                <button onClick={() => setIsPreviewModalOpen(false)} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                  <Menu size={24} className="text-slate-400" />
                </button>
              </div>
              <div className="border-2 border-slate-100 rounded-[2rem] overflow-hidden h-[500px] bg-slate-50">
                {previewData ? <PDFPreview data={previewData} /> : <div className="h-full flex items-center justify-center text-slate-400 font-black uppercase tracking-widest">Pratinjau Tidak Tersedia</div>}
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={() => setIsPreviewModalOpen(false)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Tutup Preview</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval & TTE Modals would go here - simplified for brevity */}
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 280 }}
        className="bg-[#001F54] text-white flex flex-col shadow-2xl z-50 relative"
      >
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <AnimatePresence mode="wait">
            {!isSidebarCollapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3"
              >
                <div className="bg-white p-2 rounded-xl">
                  <SiberLogo className="w-8 h-8" showText={false} />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tighter leading-none">SIBER</h1>
                  <p className="text-[10px] font-bold text-white/60 tracking-widest uppercase mt-1">BPVP AMBON</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            {isSidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {[
            { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
            { id: 'validation', label: 'Validasi Usulan', icon: ClipboardCheck },
            { id: 'archive', label: 'Arsip & Riwayat', icon: Archive },
            { id: 'recap', label: 'Rekapitulasi Data', icon: BarChart3 },
            { id: 'settings', label: 'Pengaturan', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id as any)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group relative ${
                activeMenu === item.id 
                  ? 'bg-white text-[#001F54] font-black shadow-lg shadow-black/20' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} className={activeMenu === item.id ? 'text-[#001F54]' : 'group-hover:scale-110 transition-transform'} />
              {!isSidebarCollapsed && (
                <span className="text-sm uppercase tracking-widest font-bold">{item.label}</span>
              )}
              {activeMenu === item.id && !isSidebarCollapsed && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute left-0 w-1 h-6 bg-[#001F54] rounded-r-full"
                />
              )}
            </button>
          ))}
          
          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group relative text-red-400 hover:text-red-500 hover:bg-red-500/10 mt-4"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            {!isSidebarCollapsed && (
              <span className="text-sm uppercase tracking-widest font-bold">Keluar</span>
            )}
          </button>
        </nav>

        {/* Sidebar Footer */}
        {!isSidebarCollapsed && (
          <div className="p-6 border-t border-white/10">
            <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-3 border border-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-white shadow-lg">A</div>
              <div>
                <p className="text-xs font-black uppercase tracking-tight">Administrator</p>
                <p className="text-[10px] font-bold text-white/40 uppercase">Penyelenggara</p>
              </div>
            </div>
          </div>
        )}
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between z-40">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              {activeMenu === 'dashboard' && 'Dashboard Utama'}
              {activeMenu === 'validation' && 'Validasi Usulan'}
              {activeMenu === 'archive' && 'Arsip & Riwayat'}
              {activeMenu === 'recap' && 'Rekapitulasi Data'}
              {activeMenu === 'settings' && 'Pengaturan'}
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
              Selamat Datang, Administrator Penyelenggara
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sistem Online</span>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {activeMenu === 'dashboard' && renderDashboard()}
              {activeMenu === 'validation' && renderValidation()}
              {activeMenu === 'archive' && renderArchive()}
              {activeMenu === 'recap' && (
                <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                  <BarChart3 size={64} className="mx-auto text-slate-200 mb-6" />
                  <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Fitur Rekapitulasi Sedang Dikembangkan</h3>
                </div>
              )}
              {activeMenu === 'settings' && (
                <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                  <Settings size={64} className="mx-auto text-slate-200 mb-6" />
                  <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Fitur Pengaturan Sedang Dikembangkan</h3>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Modals - Moved outside main layout for better stacking */}
      {renderModals()}
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-bounce">
          <div className="bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
            <span className="text-sm font-black uppercase tracking-widest">{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerView;
