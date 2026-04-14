
// Fix: Move VocationalCategory to the top to avoid "used before declaration" errors
export enum TrainingType {
  PBK = 'Pelatihan Berbasis Kompetensi (PBK)',
  PBL = 'Project Based Learning (PBL)'
}

export enum VocationalCategory {
  TIK = 'TIK',
  PARIWISATA = 'Pariwisata',
  BAHASA = 'Bahasa',
  GARMEN = 'Garmen',
  ELEKTRONIKA = 'Elektronika',
  LISTRIK = 'Listrik',
  REFRIGERASI = 'Refrigerasi',
  MANUFAKTUR = 'Manufaktur',
  LAS = 'Las',
  OTOMOTIF = 'Otomotif',
  BANGUNAN = 'Bangunan',
  PROCESSING = 'Processing',
  BISNIS_MANAJEMEN = 'Bisnis Manajemen',
  SMART_CREATIVE_IT = 'Smart Creative IT Skills',
  SMART_FARMING = 'Smart Farming'
}

export enum RequestStatus {
  DRAFT = 'Draft',
  PENDING = 'Menunggu Verifikasi Penyelenggara',
  REVISION = 'Perlu Revisi',
  APPROVED_TECHNICAL = 'Disetujui Penyelenggara',
  APPROVED_ADMIN = 'Disetujui Kasubag TU',
  APPROVED_FINAL = 'Disetujui PPK',
  COMPLETED = 'Selesai'
}

export enum UserRole {
  ADMIN = 'admin',
  INSTRUCTOR = 'instruktur',
  KASUBAG_TU = 'kasubag_tu',
  PPK = 'ppk'
}

export interface User {
  username: string;
  password?: string;
  role: UserRole;
  displayName: string;
  vocation?: VocationalCategory;
}

export const MOCK_USERS: User[] = [
  // Administrative Roles
  { username: 'admin', password: 'admin123', role: UserRole.ADMIN, displayName: 'Administrator Penyelenggara' },
  { username: 'tu', password: '123', role: UserRole.KASUBAG_TU, displayName: 'Kasubag TU' },
  { username: 'ppk', password: '123', role: UserRole.PPK, displayName: 'Pejabat Pembuat Komitmen (PPK)' },
  
  // Instructors (31 Users)
  { username: 'fence', password: 'Fn8!26Ab', role: UserRole.INSTRUCTOR, displayName: 'Fence Manuputty, A.Md.', vocation: VocationalCategory.MANUFAKTUR },
  { username: 'ongen', password: 'Og3#26Xc', role: UserRole.INSTRUCTOR, displayName: 'Ongen Petrason Latuharhary, A.Md', vocation: VocationalCategory.REFRIGERASI },
  { username: 'alice', password: 'Al9*26Zd', role: UserRole.INSTRUCTOR, displayName: 'Alice Amanda Kuhurima, S.T.', vocation: VocationalCategory.LISTRIK },
  { username: 'barry', password: 'Br2@26Vf', role: UserRole.INSTRUCTOR, displayName: 'Barry V. L. Silooy, A.Md.', vocation: VocationalCategory.BANGUNAN },
  { username: 'glein', password: 'Gl5%26Bg', role: UserRole.INSTRUCTOR, displayName: 'Glein Korneles Leuhery, S.Tr.M.P.K.', vocation: VocationalCategory.BANGUNAN },
  { username: 'james', password: 'Jm7^26Nh', role: UserRole.INSTRUCTOR, displayName: 'James Anderson Sohilait, S.Tr.M.P.K.', vocation: VocationalCategory.BANGUNAN },
  { username: 'cembrist', password: 'Cb4$26Mj', role: UserRole.INSTRUCTOR, displayName: 'Cembrist Kailola, A.Md.', vocation: VocationalCategory.LISTRIK },
  { username: 'rio', password: 'Ro6&26Kk', role: UserRole.INSTRUCTOR, displayName: 'Muhammad Rio Wicaksono, S.E.', vocation: VocationalCategory.PARIWISATA },
  { username: 'hazlyarta', password: 'Hz1+26Ll', role: UserRole.INSTRUCTOR, displayName: 'Hazlyarta Manullang, S.Pd.', vocation: VocationalCategory.GARMEN },
  { username: 'yansi', password: 'Yn8-26Pp', role: UserRole.INSTRUCTOR, displayName: 'Yansi Lolo Tasik, S.Pd.', vocation: VocationalCategory.OTOMOTIF },
  { username: 'papang', password: 'Pp3=26Oo', role: UserRole.INSTRUCTOR, displayName: 'Papang Zaen Nizhar, S.T.', vocation: VocationalCategory.LAS },
  { username: 'farhan', password: 'Fh9?26Ii', role: UserRole.INSTRUCTOR, displayName: 'Farhan Machfudz Ismed, S.T.', vocation: VocationalCategory.TIK },
  { username: 'iswahyudi', password: 'Is2!26Uu', role: UserRole.INSTRUCTOR, displayName: 'Iswahyudi Rusli, S.T.', vocation: VocationalCategory.OTOMOTIF },
  { username: 'fredo', password: 'Fr5@26Yy', role: UserRole.INSTRUCTOR, displayName: 'Fredo Sekeroney, A.Md.', vocation: VocationalCategory.ELEKTRONIKA },
  { username: 'janah', password: 'Jn7#26Tt', role: UserRole.INSTRUCTOR, displayName: 'Siti Nurjanah, S.Kom.', vocation: VocationalCategory.TIK },
  { username: 'dian', password: 'Dn4*26Rr', role: UserRole.INSTRUCTOR, displayName: 'Dian Lestari Pertiwi Purba, S.Pd.', vocation: VocationalCategory.ELEKTRONIKA },
  { username: 'david', password: 'Dv6%26Ee', role: UserRole.INSTRUCTOR, displayName: 'David Tua Samosir, S.T.', vocation: VocationalCategory.LISTRIK },
  { username: 'joseph', password: 'Js1^26Ww', role: UserRole.INSTRUCTOR, displayName: 'Joseph Andar P.C.H. Sihombing,Sst.Par.', vocation: VocationalCategory.PARIWISATA },
  { username: 'richad', password: 'Rc8$26Qq', role: UserRole.INSTRUCTOR, displayName: 'Richad Rivanto David, S.Kom..', vocation: VocationalCategory.TIK },
  { username: 'bastian', password: 'Bt3&26Ss', role: UserRole.INSTRUCTOR, displayName: 'Bastian Wijaya Nababan, S.T.', vocation: VocationalCategory.LAS },
  { username: 'wira', password: 'Wira9+26Dd', role: UserRole.INSTRUCTOR, displayName: 'Wira Perdana, S.St.', vocation: VocationalCategory.TIK },
  { username: 'leling', password: 'Ll2-26Ff', role: UserRole.INSTRUCTOR, displayName: 'Leling Inriyani Ch. Dimu Heo, S.Tr.Par.', vocation: VocationalCategory.BISNIS_MANAJEMEN },
  { username: 'dajuko', password: 'Dj5=26Gg', role: UserRole.INSTRUCTOR, displayName: 'Dajuko Butarbutar, S.T.', vocation: VocationalCategory.MANUFAKTUR },
  { username: 'elco', password: 'Ec7?26Hh', role: UserRole.INSTRUCTOR, displayName: 'Elco Montober Nainggolan,S.Pd.', vocation: VocationalCategory.REFRIGERASI },
  { username: 'minarto', password: 'Mn4!26Jj', role: UserRole.INSTRUCTOR, displayName: 'Minarto, S.Kom.', vocation: VocationalCategory.TIK },
  { username: 'raty', password: 'Rt6@26Kk', role: UserRole.INSTRUCTOR, displayName: 'Raty Ester Juita Siregar, S.Pd.', vocation: VocationalCategory.GARMEN },
  { username: 'anggit', password: 'Ag1#26Mm', role: UserRole.INSTRUCTOR, displayName: 'Anggit Dwi Prasetya, S.T.', vocation: VocationalCategory.OTOMOTIF },
  { username: 'usman', password: 'Us8*26Nn', role: UserRole.INSTRUCTOR, displayName: 'Usman Latuiconsina, S.T.', vocation: VocationalCategory.LAS },
  { username: 'hanny', password: 'Hy3%26Bb', role: UserRole.INSTRUCTOR, displayName: 'Hanny Erlani, S.Pd.', vocation: VocationalCategory.GARMEN },
  { username: 'said', password: 'Sd9^26Vv', role: UserRole.INSTRUCTOR, displayName: 'Abdul Said Bolota, S.Pd.', vocation: VocationalCategory.BANGUNAN },
  { username: 'mulyadi', password: 'Mu1#26Xx', role: UserRole.INSTRUCTOR, displayName: 'Mulyadi', vocation: VocationalCategory.BANGUNAN }
];

export interface HistoryLog {
  date: string;
  user: string;
  role: UserRole;
  action: string;
  comment?: string;
}

export interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  spec: string;
  keterangan?: string;
}

export interface MaterialRequest {
  id: string;
  instructorName: string;
  trainingTitle: string;
  vocation: VocationalCategory;
  proglat: string;
  dateSubmitted: string;
  items: MaterialItem[];
  status: RequestStatus;
  attachmentName?: string;
  attachmentData?: string; // Base64 or Blob URL data
  signedDocumentName?: string;
  signedDocumentData?: string; // Base64 data for signed document
  notes?: string;
  organizerComment?: string;
  tuComment?: string;
  ppkComment?: string;
  history?: HistoryLog[];
  trainingType: TrainingType;
  programPelatihan: string;
  kejuruan: VocationalCategory;
}

export const instructorNameMap: Record<string, string> = {
  "FENCE": "Fence Manuputty, A.Md.",
  "ONGEN": "Ongen Petrason Latuharhary, A.Md",
  "ALICE": "Alice Amanda Kuhurima, S.T.",
  "BARRY": "Barry V. L. Silooy, A.Md.",
  "GLEIN": "Glein Korneles Leuhery, S.Tr.M.P.K.",
  "JAMES": "James Anderson Sohilait, S.Tr.M.P.K.",
  "CEMBRIST": "Cembrist Kailola, A.Md.",
  "RIO": "Muhammad Rio Wicaksono, S.E.",
  "HAZLYARTA": "Hazlyarta Manullang, S.Pd.",
  "YANSI": "Yansi Lolo Tasik, S.Pd.",
  "PAPANG": "Papang Zaen Nizhar, S.T.",
  "FARHAN": "Farhan Machfudz Ismed, S.T.",
  "ISWAHYUDI": "Iswahyudi Rusli, S.T.",
  "FREDO": "Fredo Sekeroney, A.Md.",
  "JANAH": "Siti Nurjanah, S.Kom.",
  "DIAN": "Dian Lestari Pertiwi Purba, S.Pd.",
  "DAVID": "David Tua Samosir, S.T.",
  "JOSEPH": "Joseph Andar P.C.H. Sihombing,Sst.Par.",
  "RICHAD": "Richad Rivanto David, S.Kom..",
  "BASTIAN": "Bastian Wijaya Nababan, S.T.",
  "WIRA": "Wira Perdana, S.St.",
  "LELING": "Leling Inriyani Ch. Dimu Heo, S.Tr.Par.",
  "DAJUKO": "Dajuko Butarbutar, S.T.",
  "ELCO": "Elco Montober Nainggolan,S.Pd.",
  "MINARTO": "Minarto, S.Kom.",
  "RATY": "Raty Ester Juita Siregar, S.Pd.",
  "ANGGIT": "Anggit Dwi Prasetya, S.T.",
  "USMAN": "Usman Latuiconsina, S.T.",
  "HANNY": "Hanny Erlani, S.Pd.",
  "SAID": "Abdul Said Bolota, S.Pd."
};

export const VOCATION_COLORS: Record<VocationalCategory, string> = {
  [VocationalCategory.TIK]: 'bg-blue-100 text-blue-700 border-blue-200',
  [VocationalCategory.PARIWISATA]: 'bg-rose-100 text-rose-700 border-rose-200',
  [VocationalCategory.BAHASA]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  [VocationalCategory.GARMEN]: 'bg-purple-100 text-purple-700 border-purple-200',
  [VocationalCategory.ELEKTRONIKA]: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  [VocationalCategory.LISTRIK]: 'bg-amber-100 text-amber-700 border-amber-200',
  [VocationalCategory.REFRIGERASI]: 'bg-sky-100 text-sky-700 border-sky-200',
  [VocationalCategory.MANUFAKTUR]: 'bg-slate-100 text-slate-700 border-slate-200',
  [VocationalCategory.LAS]: 'bg-orange-100 text-orange-700 border-orange-200',
  [VocationalCategory.OTOMOTIF]: 'bg-red-100 text-red-700 border-red-200',
  [VocationalCategory.BANGUNAN]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [VocationalCategory.PROCESSING]: 'bg-teal-100 text-teal-700 border-teal-200',
  [VocationalCategory.BISNIS_MANAJEMEN]: 'bg-violet-100 text-violet-700 border-violet-200',
  [VocationalCategory.SMART_CREATIVE_IT]: 'bg-sky-100 text-sky-700 border-sky-200',
  [VocationalCategory.SMART_FARMING]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export const PROGLAT_MAPPING: Record<VocationalCategory, string[]> = {
  [VocationalCategory.LAS]: ['Plate Welder SMAW 3G', 'Fillet Welder', 'Las Industri'],
  [VocationalCategory.BANGUNAN]: ['Drafter CAD', 'Surveyor', 'Juru Ukur'],
  [VocationalCategory.OTOMOTIF]: ['Servis Sepeda Motor Injeksi', 'Kendaraan Ringan'],
  [VocationalCategory.REFRIGERASI]: ['Teknisi AC Split', 'AC Sentral'],
  [VocationalCategory.MANUFAKTUR]: ['Operator Bubut', 'CNC'],
  [VocationalCategory.PROCESSING]: ['Roti & Kue', 'Barista', 'Pengolahan Ikan'],
  [VocationalCategory.TIK]: ['Fullstack Web Development', 'Network Administrator', 'Graphic Design'],
  [VocationalCategory.GARMEN]: ['Menjahit Pakaian Sesuai Style', 'Custom Made', 'Pola Busana'],
  [VocationalCategory.PARIWISATA]: ['Front Office', 'Housekeeping', 'Tour Guide'],
  [VocationalCategory.LISTRIK]: ['Instalasi Listrik Bangunan', 'Otomasi Industri'],
  [VocationalCategory.BAHASA]: ['Bahasa Jepang Level N5', 'English for Hospitality'],
  [VocationalCategory.ELEKTRONIKA]: ['Teknisi Audio Video', 'Instrumentasi Medik'],
  [VocationalCategory.BISNIS_MANAJEMEN]: ['Administrasi Perkantoran', 'Customer Service'],
  [VocationalCategory.SMART_CREATIVE_IT]: [],
  [VocationalCategory.SMART_FARMING]: []
};

export const PBK_PROGRAMS: Record<string, string[]> = {
  [VocationalCategory.TIK]: ['Computer Operator Assistant', 'Practical Office Advance', 'Desain Grafis Muda', 'Desain Grafis Madya', 'Pemasangan Jaringan Komputer', 'Perakitan Komputer'],
  [VocationalCategory.PARIWISATA]: ['Bakery', 'Barista', 'Housekeeping', 'Restaurant Attendant', 'Housekeeping Management'],
  [VocationalCategory.GARMEN]: ['Asisten Operator Costum Made Wanita', 'Menjahit Pakaian Dengan Mesin', 'Menjahit Set Bed Cover'],
  [VocationalCategory.BISNIS_MANAJEMEN]: ['English For Fron Liner'],
  [VocationalCategory.BAHASA]: ['Junior Administrative Assistant'],
  [VocationalCategory.ELEKTRONIKA]: ['Teknisi Embedded System (Microcontroller)', 'Instalasi Fiber Optic', 'Operator Pengoperasian Otomasi Elektronika Industri', 'Teknisi Audio Video', 'Pemrograman Embedded System Berbasis IoT'],
  [VocationalCategory.LISTRIK]: ['Pemasangan Instalasi Listrik Bangunan Sederhana', 'Teknisi Pembangkit Listrik Tenaga Surya Off-Grid', 'Pemasangan Instalasi Otomasi Listrik Industri', 'Pemeliharaan Pembangkit Listrik Mikro Hydro', 'Teknisi Pembangkit Listrik Tenaga Surya'],
  [VocationalCategory.OTOMOTIF]: ['Service Sepeda Motor', 'Pemeliharaan Kendaraan Ringan Sistem Injeksi'],
  [VocationalCategory.LAS]: ['Plate Welder SMAW 3G-UP/PF', 'Plate Welder GTAW 3G-UP/PF', 'Plate Welder GTAW-SMAW 6G-UP-Hill/HLO-45'],
  [VocationalCategory.REFRIGERASI]: ['Pemeliharaan dan Perbaikan AC Untuk Rumah Tangga', 'Teknisi Refrigerasi Domestik', 'Teknisi AC Resedential'],
  [VocationalCategory.MANUFAKTUR]: ['Pembuatan Kapal Boat Fiber', 'Penggambaran Model 3D dengan CAD', 'Pembentukan Sheet Metal'],
  [VocationalCategory.BANGUNAN]: ['Juru Ukur (Surveyor)', 'Tukang Pasang Baja Ringan', 'Mengerjakan Proses Produksi dan Finishing Kayu', 'Juru Gambar Bangunan Gedung'],
  [VocationalCategory.PROCESSING]: ['Pengolahan Ikan']
};

export const PBL_PROGRAMS: Record<string, string[]> = {
  [VocationalCategory.SMART_CREATIVE_IT]: ['Penggunaan Tools Generative AI Untuk Konten Digital dan Bisnis', 'Optimalisasi Pemasaran melalui Media Sosial', 'Pengembangan Web dengan Node.js dan React'],
  [VocationalCategory.SMART_FARMING]: ['Automatic Irrigation System', 'Hydroponic Automation System']
};
