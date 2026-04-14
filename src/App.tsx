
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

  // Auth persistence check
  useEffect(() => {
    const savedUser = localStorage.getItem('simpro_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Load data on mount from Google Sheets
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch('/api/requests');
        const text = await response.text();
        
        try {
          const data = JSON.parse(text);
          if (data.requests && Array.isArray(data.requests)) {
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
              signedDocumentName: req.signedDocumentName || req['Nama TTE'] || req.signed_document_name,
              history: Array.isArray(req.history) ? req.history : (typeof req.history === 'string' ? JSON.parse(req.history) : []),
              items: Array.isArray(req.items) ? req.items : [],
              trainingType: req.trainingType || req['Jenis Pelatihan'] || req.training_type,
              programPelatihan: req.programPelatihan || req['Program Pelatihan'] || req.program_pelatihan,
              kejuruan: req.kejuruan || req['Kejuruan'] || req.kejuruan
            }));
            setRequests(mappedRequests);
          }
        } catch (e) {
          console.error('Failed to parse requests JSON:', text.substring(0, 100));
        }
      } catch (error) {
        console.error('Failed to fetch requests from Sheets:', error);
      }
    };
    fetchRequests();
  }, [currentUser]);

  const saveRequests = (newReqs: MaterialRequest[]) => {
    setRequests(newReqs);
    // Trigger sync to Google Sheets
    syncToGoogleSheets(newReqs);
  };

  const syncToGoogleSheets = async (data: MaterialRequest[]) => {
    setIsSyncing(true);
    try {
      // Map instructor names and EXCLUDE large base64 data to avoid 413 Payload Too Large
      const mappedData = data.map(({ attachmentData, signedDocumentData, ...req }) => ({
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
        console.warn('Sync failed:', result.error || result);
        
        // Handle 403 error specifically with a pop-up
        if (response.status === 403 || (result.error && result.error.includes('403'))) {
          alert("Gagal Sinkronisasi (Akses Ditolak): Pastikan Anda sudah membagikan Spreadsheet ke email Service Account sebagai EDITOR.");
        }
      } else {
        console.log('Sync success:', result.message);
      }
    } catch (error) {
      console.error('Error calling sync API:', error);
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
      <div className="hidden md:block">
        <DashboardHeader user={currentUser} onLogout={handleLogout} />
      </div>
      
      {/* Mobile Top Branding - Only visible on small screens when on profile */}
      <div className="md:hidden bg-[#003399] p-4 flex justify-center items-center gap-3">
          <SiberLogo className="h-6 w-6" />
          <h1 className="text-white font-black uppercase text-sm tracking-widest">SIBER BPVP AMBON</h1>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'home' ? (
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
