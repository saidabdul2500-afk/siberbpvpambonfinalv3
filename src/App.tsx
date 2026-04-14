
import React, { useState, useEffect } from 'react';
import { MaterialRequest, UserRole, RequestStatus, VocationalCategory, PROGLAT_MAPPING, User, HistoryLog, TrainingType, instructorNameMap, MOCK_USERS } from './types';
import DashboardHeader from './components/DashboardHeader';
import InstructorView from './components/InstructorView';
import OrganizerView from './components/OrganizerView';
import KasubagTUView from './components/KasubagTUView';
import PPKView from './components/PPKView';
import ProfileView from './components/ProfileView';
import Login from './components/Login';
import SiberLogo from './components/SiberLogo';

type TabType = 'home' | 'profile';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Load users from Google Sheets
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          if (data.users && Array.isArray(data.users)) {
            const fetchedUsers = data.users.map((u: any) => ({
              username: String(u.username || u['Username'] || u.username || '').trim(),
              password: String(u.password || u['Password'] || u.password || '').trim(),
              role: (u.role || u['Role'] || u.role || '').toLowerCase(),
              displayName: u.displayName || u['Nama Lengkap'] || u.display_name || '',
              vocation: u.vocation || u['Kejuruan'] || u.vocation || ''
            })).filter(u => u.username && u.password);

            if (fetchedUsers.length > 0) {
              // Merge with MOCK_USERS, fetched users take priority
              const combinedUsers = [...fetchedUsers];
              MOCK_USERS.forEach(mockUser => {
                if (!combinedUsers.find(u => u.username.toLowerCase() === mockUser.username.toLowerCase())) {
                  combinedUsers.push(mockUser);
                }
              });
              setUsers(combinedUsers);
            }
          }
        } catch (e) {
          console.error('Failed to parse users JSON:', text.substring(0, 100));
        }
      } catch (error) {
        console.error('Failed to fetch users from Sheets:', error);
      }
    };
    fetchUsers();
  }, []);


  // Load data on mount and set up polling
  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/requests');
      const text = await response.text();
      
      try {
        const data = JSON.parse(text);
        if (data && data.requests && Array.isArray(data.requests)) {
          // Map keys if they come from Indonesian headers
          const mappedRequests = data.requests.map((req: any) => ({
            id: req.id || req['ID Pengajuan'] || req.id_pengajuan,
            instructorName: req.instructorName || req['Nama Instruktur'] || req.nama_instruktur,
            trainingTitle: req.trainingTitle || req['Program Pelatihan'] || req.proglat || req.training_title,
            vocation: req.vocation || req['Kejuruan'] || req.kejuruan,
            proglat: req.proglat || req['Proglat'] || req.proglat,
            dateSubmitted: req.dateSubmitted || req['Tanggal'] || req.tanggal,
            status: req.status || req['Status'] || req.status,
            notes: req.notes || req['Catatan'] || req.notes,
            organizerComment: req.organizerComment || req['Catatan Penyelenggara'] || req.organizer_comment,
            tuComment: req.tuComment || req['Catatan TU'] || req.tu_comment,
            ppkComment: req.ppkComment || req['Catatan PPK'] || req.ppk_comment,
            attachmentName: req.attachmentName || req['Nama Lampiran'] || req.attachment_name,
            attachmentData: req.attachmentData || req['Data Lampiran'] || req.attachment_data,
            signedDocumentName: req.signedDocumentName || req['Nama TTE'] || req.signed_document_name,
            signedDocumentData: req.signedDocumentData || req['Data TTE'] || req.signed_document_data,
            history: Array.isArray(req.history) ? req.history : (typeof req.history === 'string' ? JSON.parse(req.history) : []),
            items: Array.isArray(req.items) ? req.items : [],
            trainingType: req.trainingType || req['Jenis Pelatihan'] || req.training_type,
            programPelatihan: req.programPelatihan || req['Program Pelatihan'] || req.program_pelatihan,
            kejuruan: req.kejuruan || req['Kejuruan'] || req.kejuruan
          }));
          
          // Only update if data has actually changed to avoid unnecessary re-renders
          setRequests(prev => {
            const isChanged = JSON.stringify(prev) !== JSON.stringify(mappedRequests);
            return isChanged ? mappedRequests : prev;
          });
          setHasLoadedInitialData(true);
          setSyncError(null);
        } else {
          console.warn('Data format invalid or empty:', data);
          setHasLoadedInitialData(true); // Still set to true so UI shows (even if empty)
          if (data && data.error) {
            setSyncError(data.error);
          }
        }
      } catch (e) {
        console.error('Failed to parse requests JSON:', text.substring(0, 100));
        setSyncError('Format data dari server tidak valid.');
        setHasLoadedInitialData(true);
      }
    } catch (error) {
      console.error('Failed to fetch requests from Sheets:', error);
      setSyncError('Koneksi ke Spreadsheet terputus.');
      setHasLoadedInitialData(true);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchRequests();
      
      // Set up polling every 30 seconds
      const interval = setInterval(fetchRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Auth persistence and cross-tab sync
  useEffect(() => {
    const savedUser = localStorage.getItem('simpro_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    // Listen for changes in other tabs (login/logout)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'simpro_user') {
        if (e.newValue) {
          setCurrentUser(JSON.parse(e.newValue));
        } else {
          setCurrentUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveRequests = (newReqs: MaterialRequest[]) => {
    setRequests(newReqs);
    // Trigger sync to Google Sheets
    if (hasLoadedInitialData) {
      syncToGoogleSheets(newReqs);
    } else {
      console.warn('Sync skipped: Initial data not loaded yet.');
      alert("Peringatan: Data belum sinkron dengan Spreadsheet. Silakan tunggu sebentar atau refresh halaman.");
    }
  };

  const syncToGoogleSheets = async (data: MaterialRequest[]) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      // Map instructor names
      const mappedData = data.map((req) => ({
        ...req,
        instructorName: instructorNameMap[(req.instructorName || '').toUpperCase()] || req.instructorName
      }));

      console.log('Attempting to sync requests:', mappedData.length);

      const response = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: mappedData }),
      });
      
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        result = { error: 'Invalid JSON response', details: text.substring(0, 100) };
      }

      if (!response.ok) {
        const errorMsg = result.error || 'Gagal sinkronisasi';
        console.warn('Sync failed:', errorMsg);
        setSyncError(errorMsg);
        
        // Handle 403 error specifically with a pop-up
        if (response.status === 403 || (errorMsg && errorMsg.includes('403'))) {
          alert("Gagal Sinkronisasi (Akses Ditolak): Pastikan Anda sudah membagikan Spreadsheet ke email Service Account sebagai EDITOR.");
        }
      } else {
        console.log('Sync success:', result.message);
      }
    } catch (error: any) {
      console.error('Error calling sync API:', error);
      setSyncError(error.message || 'Kesalahan jaringan saat sinkronisasi');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('simpro_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('simpro_user');
    setActiveTab('home');
  };

  const handleInstructorSubmit = (req: Partial<MaterialRequest>) => {
    const newReq: MaterialRequest = {
      ...req,
      id: Math.random().toString(36).substr(2, 9),
      history: [{
        date: new Date().toISOString(),
        user: currentUser?.displayName || 'Sistem',
        role: UserRole.INSTRUCTOR,
        action: 'Pengajuan Dibuat'
      }]
    } as MaterialRequest;
    saveRequests([newReq, ...requests]);
  };

  const handleStatusUpdate = (id: string, status: RequestStatus, comment?: string, signedDocName?: string, signedDocData?: string) => {
    const updated = requests.map(r => {
      if (r.id === id) {
        const newHistory: HistoryLog = {
          date: new Date().toISOString(),
          user: currentUser?.displayName || 'Sistem',
          role: currentUser?.role || UserRole.ADMIN,
          action: status === RequestStatus.REVISION ? 'Dikembalikan (Revisi)' : 
                  status === RequestStatus.APPROVED_TECHNICAL ? 'Disetujui Teknis' :
                  status === RequestStatus.APPROVED_ADMIN ? 'Disetujui Administrasi' :
                  status === RequestStatus.APPROVED_FINAL ? 'Disetujui Pengadaan' : 'Update Status',
          comment
        };

        return { 
          ...r, 
          status, 
          organizerComment: currentUser?.role === UserRole.ADMIN ? (comment || r.organizerComment) : r.organizerComment,
          tuComment: currentUser?.role === UserRole.KASUBAG_TU ? (comment || r.tuComment) : r.tuComment,
          ppkComment: currentUser?.role === UserRole.PPK ? (comment || r.ppkComment) : r.ppkComment,
          signedDocumentName: signedDocName || r.signedDocumentName,
          signedDocumentData: signedDocData || r.signedDocumentData,
          history: [...(r.history || []), newHistory]
        };
      }
      return r;
    });
    saveRequests(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua pengajuan dan riwayat? Tindakan ini tidak dapat dibatalkan.')) {
      saveRequests([]);
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} users={users} />;
  }

  const getPersonalData = () => {
    if (currentUser.role === UserRole.ADMIN) return requests;
    return requests.filter(r => r.instructorName === currentUser.displayName);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 selection:bg-blue-100 selection:text-[#003399]">
      {/* Header - Hidden on mobile */}
      <div className="hidden md:block relative">
        <DashboardHeader user={currentUser} onLogout={handleLogout} />
        
        {/* Sync Status Indicator */}
        <div className="absolute top-4 right-64 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur border border-slate-100 shadow-sm">
          {isSyncing ? (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Sinkronisasi...</span>
            </>
          ) : syncError ? (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-[9px] font-black text-red-600 uppercase tracking-widest truncate max-w-[150px]" title={syncError}>Error Sync</span>
              <button 
                onClick={() => syncToGoogleSheets(requests)}
                className="ml-1 p-1 hover:bg-red-50 rounded-md text-red-600"
                title="Coba Lagi"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Terhubung</span>
              <button 
                onClick={fetchRequests}
                className="ml-1 p-1 hover:bg-emerald-50 rounded-md text-emerald-600 transition-colors"
                title="Refresh Data"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Mobile Top Branding - Only visible on small screens when on profile */}
      <div className="md:hidden bg-[#003399] p-4 flex justify-center items-center gap-3">
          <SiberLogo className="h-6 w-6" />
          <h1 className="text-white font-black uppercase text-sm tracking-widest">SIBER BPVP AMBON</h1>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="max-w-5xl mx-auto">
          {!hasLoadedInitialData ? (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              {syncError && !requests.length ? (
                <>
                  <div className="bg-red-50 p-6 rounded-[2rem] border-2 border-red-100 text-center max-w-md">
                    <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm font-black text-red-600 uppercase tracking-widest mb-2">Gagal Memuat Data</p>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest leading-relaxed mb-6">{syncError}</p>
                    <button 
                      onClick={() => fetchRequests()}
                      className="bg-red-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all active:scale-95"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 border-4 border-blue-100 border-t-[#003399] rounded-full animate-spin"></div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Memuat Data Sistem...</p>
                </>
              )}
            </div>
          ) : activeTab === 'home' ? (
            currentUser.role === UserRole.INSTRUCTOR ? (
              <InstructorView 
                user={currentUser}
                requests={getPersonalData()}
                onSubmit={handleInstructorSubmit}
              />
            ) : currentUser.role === UserRole.ADMIN ? (
              <OrganizerView 
                requests={requests}
                onAction={handleStatusUpdate}
              />
            ) : currentUser.role === UserRole.KASUBAG_TU ? (
              <KasubagTUView 
                user={currentUser}
                requests={requests}
                onAction={handleStatusUpdate}
              />
            ) : (
              <PPKView 
                user={currentUser}
                requests={requests}
                onAction={handleStatusUpdate}
              />
            )
          ) : (
            <ProfileView 
              user={currentUser}
              onLogout={handleLogout}
            />
          )}
        </div>
      </main>

      {/* Desktop Footer - Hidden on mobile */}
      <footer className="hidden md:block bg-white border-t border-slate-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="flex items-center gap-6">
                 <div className="bg-slate-50 p-2 rounded-xl grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                    <SiberLogo className="h-12 w-12" />
                 </div>
                 <div className="h-12 w-px bg-slate-200"></div>
                 <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase">SIBER BPVP AMBON</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Kementerian Ketenagakerjaan RI</p>
                 </div>
              </div>
              
              <div className="flex flex-col items-center md:items-end gap-3">
                 <div className="flex gap-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <span className="hover:text-[#003399] cursor-pointer transition-colors">Bantuan</span>
                    <span className="hover:text-[#003399] cursor-pointer transition-colors">Panduan Sistem</span>
                    <span className="hover:text-[#003399] cursor-pointer transition-colors">Kebijakan Privasi</span>
                 </div>
                 <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">© 2026 SIBER BPVP AMBON - Direktorat Jenderal Binalavotas</p>
              </div>
           </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation - Only visible on small screens */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around h-20 px-6 z-50 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-[#003399]' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-2xl transition-all ${activeTab === 'home' ? 'bg-blue-50' : 'bg-transparent'}`}>
            <svg className="w-6 h-6" fill={activeTab === 'home' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Beranda</span>
        </button>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-[#003399]' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-2xl transition-all ${activeTab === 'profile' ? 'bg-blue-50' : 'bg-transparent'}`}>
            <svg className="w-6 h-6" fill={activeTab === 'profile' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Akun Saya</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
