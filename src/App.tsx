
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
import ChangePasswordModal from './components/ChangePasswordModal';

type TabType = 'home' | 'profile';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pendingSyncIds, setPendingSyncIds] = useState<Set<string>>(new Set());
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Helper to sort requests by date descending
  const sortRequests = (reqs: MaterialRequest[]) => {
    return [...reqs].sort((a, b) => {
      const dateA = a.dateSubmitted ? new Date(a.dateSubmitted).getTime() : 0;
      const dateB = b.dateSubmitted ? new Date(b.dateSubmitted).getTime() : 0;
      if (isNaN(dateA) || isNaN(dateB)) return 0;
      return dateB - dateA;
    });
  };

  /**
   * Helper to resolve API URL. If VITE_APPS_SCRIPT_URL is provided, 
   * it calls Apps Script directly (useful for Netlify/Static hosting).
   */
  const getApiUrl = (endpoint: string) => {
    const appsScriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (appsScriptUrl && appsScriptUrl.startsWith('http')) {
      const url = new URL(appsScriptUrl);
      if (endpoint === '/api/users') url.searchParams.set('action', 'getUsers');
      if (endpoint === '/api/requests') url.searchParams.set('action', 'getRequests');
      return url.toString();
    }
    return endpoint;
  };

  // Load users from Google Sheets
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(getApiUrl('/api/users'));
        const text = await response.text();
        console.log('Raw data from Apps Script:', text.substring(0, 500));
        try {
          const data = JSON.parse(text);
          if (data.users && Array.isArray(data.users)) {
            const fetchedUsers = data.users.map((u: any) => ({
              username: String(u.username || u['Username'] || u.username || '').trim(),
              password: String(u.password || u['Password'] || u['password'] || '').trim(),
              role: String(u.role || u['Role'] || u['role'] || '').toLowerCase(),
              // Aggressive mapping for name based on Apps Script lowercase transformation
              displayName: u.displayname || u.namalengkap || u['Nama Lengkap'] || u.displayName || u.display_name || u.nama_lengkap || u.nama || u.namainstruktur || u.username || u['Username'] || '',
              vocation: u.vocation || u['Kejuruan'] || u['kejuruan'] || ''
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
    if (isSyncing) {
      console.log('Sync in progress, skipping fetch to avoid race condition');
      return;
    }
    
    try {
      const response = await fetch(getApiUrl('/api/requests'));
      const text = await response.text();
      console.log('Raw requests data from Apps Script:', text.substring(0, 500));
      
      try {
        const data = JSON.parse(text);
        if (data && data.requests && Array.isArray(data.requests)) {
          // Map keys if they come from Indonesian headers
          const mappedRequests = data.requests.map((req: any) => {
            // Helper to get value by multiple possible header names
            const getVal = (keys: string[]) => {
              for (const key of keys) {
                const val = req[key];
                if (val !== undefined && val !== null && val !== '') return val;
              }
              // Second pass: check if any key exists but is empty string
              for (const key of keys) {
                if (req[key] !== undefined && req[key] !== null) return req[key];
              }
              return undefined;
            };

            let status = getVal(['status', 'Status', 'status_request']);
            const trainingType = getVal(['trainingType', 'Jenis Pelatihan', 'training_type']);
            const signedData = getVal(['signedDocumentData', 'Data TTE', 'signed_document_data', 'TTE', 'tte_data']);
            let vocation = getVal(['vocation', 'Kejuruan', 'kejuruan', 'vocation_category']);

            // Fix for column shift: if status looks like a training type, it's probably in the wrong column
            // and the real status might be in the 'Data TTE' column (as seen in user's spreadsheet)
            if (status === TrainingType.PBK || status === TrainingType.PBL) {
              // Check if signedData contains a valid RequestStatus string
              const possibleStatus = Object.values(RequestStatus).find(s => s === signedData);
              if (possibleStatus) {
                status = possibleStatus;
              } else if (!status || status === '-') {
                status = RequestStatus.PENDING;
              }
            }
            
            // If vocation is missing but 'Data Lampiran' contains a vocation string
            if (!vocation || vocation === '-') {
              const possibleVocation = getVal(['Data Lampiran', 'Lampiran', 'attachment_data']);
              if (Object.values(VocationalCategory).includes(possibleVocation as VocationalCategory)) {
                vocation = possibleVocation;
              }
            }

            // Normalize status for old data strings
            if (status === 'Menunggu Verifikasi Teknis') status = RequestStatus.PENDING;
            if (status === 'Lolos Verifikasi Teknis (Penyelenggara)') status = RequestStatus.APPROVED_TECHNICAL;
            if (status === 'Lolos Verifikasi Administrasi (TU)') status = RequestStatus.APPROVED_ADMIN;
            if (status === 'Dalam Proses Pengadaan') status = RequestStatus.APPROVED_FINAL;
            if (status === 'Selesai Pengadaan') status = RequestStatus.COMPLETED;

            // If status is empty but it's a new request, default to PENDING
            if (!status || status === '-') {
              status = RequestStatus.PENDING;
            }

            return {
              id: getVal(['id', 'ID Pengajuan', 'id_pengajuan', 'id_request']),
              instructorName: getVal(['instructorName', 'Nama Instruktur', 'nama_instruktur', 'instructor_name']),
              trainingTitle: getVal(['trainingTitle', 'Program Pelatihan', 'training_title', 'program_pelatihan']),
              vocation: vocation,
              proglat: getVal(['proglat', 'Proglat', 'program_pelatihan_detail']),
              dateSubmitted: getVal(['dateSubmitted', 'Tanggal', 'tanggal', 'date_submitted']),
              status: status,
              notes: getVal(['notes', 'Catatan']),
              instructorNotes: getVal(['instructorNotes', 'Catatan Instruktur', 'instructor_notes', 'catatan_instruktur']),
              organizerComment: getVal(['organizerComment', 'Catatan Penyelenggara', 'organizer_comment', 'catatan_penyelenggara']),
              tuComment: getVal(['tuComment', 'Catatan TU', 'tu_comment', 'catatan_tu']),
              ppkComment: getVal(['ppkComment', 'Catatan PPK', 'ppk_comment', 'catatan_ppk']),
              attachmentName: getVal(['attachmentName', 'Nama Lampiran', 'attachment_name', 'nama_berkas']),
              attachmentData: getVal(['attachmentData', 'Data Lampiran', 'attachment_data', 'Lampiran', 'berkas_data']),
              signedDocumentName: getVal(['signedDocumentName', 'Nama TTE', 'signed_document_name', 'nama_tte']),
              signedDocumentData: signedData,
              history: (() => {
                const h = getVal(['history', 'Riwayat', 'history_log', 'riwayat_log']);
                if (Array.isArray(h)) return h;
                if (typeof h === 'string') {
                  try {
                    return JSON.parse(h);
                  } catch (e) {
                    console.error('Failed to parse history:', h);
                    return [];
                  }
                }
                return [];
              })(),
              items: (() => {
                const it = getVal(['items', 'Barang', 'items_list', 'daftar_barang']);
                if (Array.isArray(it)) return it;
                if (typeof it === 'string') {
                  try {
                    return JSON.parse(it);
                  } catch (e) {
                    console.error('Failed to parse items:', it);
                    return [];
                  }
                }
                return [];
              })(),
              trainingType: trainingType,
              programPelatihan: getVal(['programPelatihan', 'Program Pelatihan', 'program_pelatihan', 'training_program']),
              kejuruan: vocation
            } as MaterialRequest;
          });

          const sortedRequests = sortRequests(mappedRequests);
          
          // Merge logic: Don't overwrite requests that are currently being synced
          setRequests(prev => {
            const merged = [...sortedRequests];
            
            // If we have local requests that are pending sync, keep them
            if (pendingSyncIds.size > 0) {
              prev.forEach(localReq => {
                if (pendingSyncIds.has(String(localReq.id))) {
                  const index = merged.findIndex(r => String(r.id) === String(localReq.id));
                  if (index !== -1) {
                    merged[index] = localReq;
                  } else {
                    merged.unshift(localReq);
                  }
                }
              });
            }
            
            const sortedMerged = sortRequests(merged);
            if (JSON.stringify(prev) !== JSON.stringify(sortedMerged)) {
              return sortedMerged;
            }
            return prev;
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

  const saveRequests = async (newReqs: MaterialRequest[], action?: 'ADD' | 'UPDATE', targetReq?: MaterialRequest) => {
    setRequests(sortRequests(newReqs));
    // Trigger sync to Google Sheets
    if (hasLoadedInitialData && action && targetReq) {
      await syncSingleRequest(targetReq, action);
    }
  };

  const syncSingleRequest = async (req: MaterialRequest, action: 'ADD' | 'UPDATE') => {
    setIsSyncing(true);
    setSyncError(null);
    
    // Add to pending sync set to prevent polling from overwriting local state
    setPendingSyncIds(prev => new Set(prev).add(String(req.id)));

    try {
      // Map to spreadsheet headers to ensure Apps Script can find the columns
      const spreadsheetRequest = {
        ...req,
        'ID Pengajuan': req.id,
        'Nama Instruktur': instructorNameMap[(req.instructorName || '').toUpperCase()] || req.instructorName,
        'Program Pelatihan': req.trainingTitle,
        'Kejuruan': req.vocation,
        'Proglat': req.proglat,
        'Tanggal': req.dateSubmitted,
        'Status': req.status,
        'Catatan': req.notes,
        'Catatan Penyelenggara': req.organizerComment,
        'Catatan TU': req.tuComment,
        'Catatan PPK': req.ppkComment,
        'Catatan Instruktur': req.instructorNotes,
        // Add specific keys requested by user for Apps Script
        'organizerNotes': req.organizerComment,
        'tuNotes': req.tuComment,
        'ppkNotes': req.ppkComment,
        'instructorNotes': req.instructorNotes,
        'Nama Lampiran': req.attachmentName,
        'Data Lampiran': req.attachmentData,
        'Nama TTE': req.signedDocumentName,
        'Data TTE': req.signedDocumentData,
        'Riwayat': JSON.stringify(req.history || []),
        'Barang': JSON.stringify(req.items || []),
        'Jenis Pelatihan': req.trainingType,
        history: JSON.stringify(req.history || []),
        items: JSON.stringify(req.items || [])
      };

      const response = await fetch(getApiUrl('/api/sync-single'), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ 
          action, 
          request: spreadsheetRequest
        }),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal sinkronisasi');
      
      // Refresh data after sync to ensure all tabs are consistent
      // Add a longer delay to allow Google Sheets to process the update
      setTimeout(() => {
        setPendingSyncIds(prev => {
          const next = new Set(prev);
          next.delete(String(req.id));
          return next;
        });
        fetchRequests();
      }, 15000); // Increased to 15s for better reliability
    } catch (error: any) {
      console.error('Sync error:', error);
      setSyncError(error.message);
      alert(`Gagal sinkronisasi: ${error.message}`);
      // Remove from pending on error so user can retry or see server state
      setPendingSyncIds(prev => {
        const next = new Set(prev);
        next.delete(String(req.id));
        return next;
      });
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
    setRequests([]); // Clear data on logout to avoid confusion
    localStorage.removeItem('simpro_user');
    setActiveTab('home');
  };

  const handleInstructorSubmit = (req: Partial<MaterialRequest>) => {
    const isUpdate = !!req.id;
    const existingReq = isUpdate ? requests.find(r => String(r.id) === String(req.id)) : null;

    const newHistory: HistoryLog = {
      date: new Date().toISOString(),
      user: currentUser?.displayName || 'Sistem',
      role: UserRole.INSTRUCTOR,
      action: isUpdate ? 'Pengajuan Diperbaiki' : 'Pengajuan Dibuat'
    };

    const updatedReq = { 
      ...req, 
      id: req.id || Math.random().toString(36).substr(2, 9),
      instructorName: req.instructorName || currentUser?.displayName || '',
      history: isUpdate && existingReq 
        ? [...(existingReq.history || []), newHistory]
        : [newHistory]
    } as MaterialRequest;

    if (isUpdate) {
      const updatedReqs = requests.map(r => String(r.id) === String(req.id) ? updatedReq : r);
      saveRequests(updatedReqs, 'UPDATE', updatedReq);
    } else {
      saveRequests([updatedReq, ...requests], 'ADD', updatedReq);
    }
  };

  const handleStatusUpdate = async (id: string, status: RequestStatus, comment?: string, signedDocName?: string, signedDocData?: string) => {
    let targetReq: MaterialRequest | undefined;
    const updated = requests.map(r => {
      if (String(r.id) === String(id)) {
        const newHistory: HistoryLog = {
          date: new Date().toISOString(),
          user: currentUser?.displayName || 'Sistem',
          role: currentUser?.role || UserRole.ADMIN,
          action: status === RequestStatus.REVISION ? 'Dikembalikan (Revisi)' : 
                  status === RequestStatus.REVISION_TO_ORGANIZER ? 'Dikembalikan ke Penyelenggara (Revisi)' :
                  status === RequestStatus.REVISION_FROM_TU ? 'Dikembalikan ke Penyelenggara (Revisi dari TU)' :
                  status === RequestStatus.REVISION_FROM_PPK ? 'Dikembalikan ke Penyelenggara (Revisi dari PPK)' :
                  status === RequestStatus.APPROVED_TECHNICAL ? 'Diverifikasi Penyelenggara' :
                  status === RequestStatus.APPROVED_ADMIN ? 'Disetujui TU' :
                  status === RequestStatus.APPROVED_FINAL ? 'Disetujui PPK' : 'Update Status',
          comment: comment || undefined
        };

        // Explicitly preserve existing comments if not being updated by the current role
        const updatedOrganizerComment = currentUser?.role === UserRole.ADMIN ? (comment || r.organizerComment) : r.organizerComment;
        const updatedTuComment = currentUser?.role === UserRole.KASUBAG_TU ? (comment || r.tuComment) : r.tuComment;
        const updatedPpkComment = currentUser?.role === UserRole.PPK ? (comment || r.ppkComment) : r.ppkComment;

        // Fallback: Append revision notes to the main 'notes' field so it's saved in the 'Catatan' column
        // This ensures data isn't lost if the user's Google Sheet doesn't have the specific comment columns
        let updatedNotes = r.notes || '';
        if (comment && status === RequestStatus.REVISION && currentUser?.role === UserRole.ADMIN) {
          // Explicitly set notes to the comment for Organizer revision to Instructor as requested
          updatedNotes = comment;
        } else if (comment && (status === RequestStatus.REVISION || status === RequestStatus.REVISION_TO_ORGANIZER || status === RequestStatus.REVISION_FROM_TU || status === RequestStatus.REVISION_FROM_PPK)) {
          const prefix = currentUser?.role === UserRole.ADMIN ? 'Penyelenggara' :
                         currentUser?.role === UserRole.KASUBAG_TU ? 'Kasubag TU' :
                         currentUser?.role === UserRole.PPK ? 'PPK' : 'Sistem';
          
          // Only append if it's not already there to prevent duplicates on multiple syncs
          const noteToAdd = `\n\n[Revisi ${prefix}]: ${comment}`;
          if (!updatedNotes.includes(`[Revisi ${prefix}]: ${comment}`)) {
            updatedNotes = updatedNotes + noteToAdd;
          }
        }

        targetReq = { 
          ...r, 
          status, 
          notes: updatedNotes.trim(),
          organizerComment: updatedOrganizerComment || '',
          tuComment: updatedTuComment || '',
          ppkComment: updatedPpkComment || '',
          signedDocumentName: signedDocName || r.signedDocumentName || '',
          signedDocumentData: signedDocData || r.signedDocumentData || '',
          history: [...(r.history || []), newHistory]
        };
        return targetReq;
      }
      return r;
    });
    if (targetReq) {
      await saveRequests(updated, 'UPDATE', targetReq);
    }
  };

  const handleDeleteRequest = async (id: string, role: UserRole) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini secara permanen dari sistem?')) return;

    setIsSyncing(true);
    try {
      const response = await fetch(getApiUrl('/api/delete'), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteRequest', id, role }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus data');

      setRequests(prev => prev.filter(r => String(r.id) !== String(id)));
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`Gagal menghapus: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
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
    // Match by display name or username for backward compatibility (case-insensitive)
    return requests.filter(r => {
      const instructorName = String(r.instructorName || '').trim().toLowerCase();
      const userDisplay = String(currentUser.displayName || '').trim().toLowerCase();
      const userName = String(currentUser.username || '').trim().toLowerCase();
      
      return instructorName === userDisplay || instructorName === userName || instructorName.includes(userName);
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 selection:bg-blue-100 selection:text-[#003399]">
      {/* Header - Hidden on mobile */}
      <div className="hidden md:block relative">
        <DashboardHeader 
        user={currentUser} 
        onLogout={handleLogout} 
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        onOpenManual={() => setIsManualModalOpen(true)}
      />
        
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
                onClick={fetchRequests}
                className="ml-1 p-1 hover:bg-red-50 rounded-md text-red-600"
                title="Refresh Data"
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
                onLogout={handleLogout}
                onDelete={(id) => handleDeleteRequest(id, currentUser.role)}
                isManualModalOpen={isManualModalOpen}
                setIsManualModalOpen={setIsManualModalOpen}
              />
            ) : currentUser.role === UserRole.ADMIN ? (
              <OrganizerView 
                requests={requests}
                onAction={handleStatusUpdate}
                onLogout={handleLogout}
                onDelete={(id) => handleDeleteRequest(id, currentUser.role)}
                isManualModalOpen={isManualModalOpen}
                setIsManualModalOpen={setIsManualModalOpen}
              />
            ) : currentUser.role === UserRole.KASUBAG_TU ? (
              <KasubagTUView 
                user={currentUser}
                requests={requests}
                onAction={handleStatusUpdate}
                onDelete={(id) => handleDeleteRequest(id, currentUser.role)}
                isManualModalOpen={isManualModalOpen}
                setIsManualModalOpen={setIsManualModalOpen}
              />
            ) : (
              <PPKView 
                user={currentUser}
                requests={requests}
                onAction={handleStatusUpdate}
                onDelete={(id) => handleDeleteRequest(id, currentUser.role)}
                isManualModalOpen={isManualModalOpen}
                setIsManualModalOpen={setIsManualModalOpen}
              />
            )
          ) : (
            <ProfileView 
              user={currentUser}
              onLogout={handleLogout}
              openChangePassword={() => setIsChangePasswordModalOpen(true)}
              openManual={() => {
                setActiveTab('home');
                setIsManualModalOpen(true);
              }}
            />
          )}
        </div>
      </main>

      {/* Desktop Footer - Hidden on mobile */}
      <footer className="hidden md:block bg-white border-t border-slate-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-6">
                 <div className="bg-slate-50 p-2 rounded-xl grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                    <SiberLogo className="h-12 w-12" />
                 </div>
                 <div className="h-12 w-px bg-slate-200"></div>
                 <div className="flex flex-col">
                    <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase">SIBER BPVP AMBON</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Kementerian Ketenagakerjaan RI</p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Direktorat Jenderal Binalavotas</p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">© 2026 SIBER BPVP AMBON</p>
                 </div>
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
      {isSyncing && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-white/90 backdrop-blur-md border border-blue-100 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sinkronisasi Data...</p>
        </div>
      )}

      {currentUser && (
        <ChangePasswordModal 
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          user={currentUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;
