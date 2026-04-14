import React, { useEffect, useState } from 'react';

interface PDFPreviewProps {
  data: string;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ data }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      setBlobUrl(null);
      setError(null);
      return;
    }
    
    // Check if data is a URL (including blob URLs)
    if (data.startsWith('http://') || data.startsWith('https://') || data.startsWith('blob:')) {
      setBlobUrl(data);
      setError(null);
      return;
    }

    try {
      // Basic validation for base64
      if (data.length < 100) {
        throw new Error("Data file tidak valid atau terlalu kecil.");
      }

      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setError(null);

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error('Error creating PDF blob:', err);
      setBlobUrl(null);
      setError(err instanceof Error ? err.message : 'Gagal memproses data PDF');
    }
  }, [data]);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-4 p-8 text-center bg-slate-50">
        <div className="bg-red-50 p-4 rounded-2xl mb-2">
          <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-red-500">Gagal Memuat Pratinjau</p>
        <p className="text-[10px] italic max-w-xs leading-relaxed">
          {data && data.length > 45000 ? 
            "File mungkin terlalu besar untuk disimpan di Google Sheets (Limit 50rb karakter). Silakan gunakan file yang lebih kecil atau kompres PDF Anda." : 
            "Data dokumen tidak valid atau rusak."}
        </p>
        <button 
          onClick={() => {
            const link = document.createElement('a');
            link.href = (data.startsWith('http') || data.startsWith('blob:')) ? data : `data:application/pdf;base64,${data}`;
            link.download = 'dokumen.pdf';
            link.click();
          }}
          className="mt-4 bg-slate-800 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200"
        >
          Unduh File Langsung
        </button>
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-50">
        <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-xs font-bold uppercase tracking-widest">Pratinjau tidak tersedia</p>
        <p className="text-[10px] italic">Unggah file baru untuk melihat fitur pratinjau</p>
      </div>
    );
  }

  return (
    <iframe 
      src={`${blobUrl}#toolbar=1&navpanes=0&scrollbar=1`} 
      className="w-full h-full border-none" 
      title="PDF Preview"
    />
  );
};

export default PDFPreview;
