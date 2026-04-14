import React, { useEffect, useState } from 'react';

interface PDFPreviewProps {
  data: string;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ data }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    
    try {
      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.error('Error creating PDF blob:', error);
      setBlobUrl(null);
    }
  }, [data]);

  if (!blobUrl) return null;

  return (
    <iframe 
      src={`${blobUrl}#toolbar=1&navpanes=0&scrollbar=1`} 
      className="w-full h-full border-none" 
      title="PDF Preview"
    />
  );
};

export default PDFPreview;
