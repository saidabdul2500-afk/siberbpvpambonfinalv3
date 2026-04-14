
import React from 'react';

interface SiberLogoProps {
  className?: string;
  showText?: boolean;
}

const SiberLogo: React.FC<SiberLogoProps> = ({ className = "w-16 h-16", showText = false }) => (
  <div className={`flex flex-col items-center ${className}`}>
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="arrowGradient" x1="40" y1="160" x2="160" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#008080" />
        </linearGradient>
        <linearGradient id="sGradient" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#003399" />
          <stop offset="100%" stopColor="#0055CC" />
        </linearGradient>
      </defs>
      
      {/* Background Grid Pattern (Subtle) */}
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F0F0F0" strokeWidth="0.5"/>
      </pattern>
      <rect width="200" height="200" fill="url(#grid)" rx="20" />

      {/* Stylized 'S' Pathways */}
      <path 
        d="M150 70 C150 40, 50 40, 50 70 C50 100, 150 100, 150 130 C150 160, 50 160, 50 130" 
        stroke="url(#sGradient)" 
        strokeWidth="15" 
        strokeLinecap="round" 
        fill="none"
      />
      
      {/* Digital Nodes / Icons within 'S' */}
      <circle cx="70" cy="60" r="4" fill="#008080" />
      <rect x="120" y="140" width="8" height="8" fill="#FFA500" rx="1" />
      <path d="M100 95 L110 105 M110 95 L100 105" stroke="#003399" strokeWidth="2" />
      
      {/* Dynamic Arrow */}
      <path 
        d="M40 160 L160 40 M160 40 L130 40 M160 40 L160 70" 
        stroke="url(#arrowGradient)" 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {showText && (
        <g transform="translate(0, 220)">
          <text x="100" y="0" textAnchor="middle" className="font-sans font-black" fill="#003399" style={{ fontSize: '40px' }}>SIBER</text>
          <text x="100" y="45" textAnchor="middle" className="font-sans font-bold" fill="#003399" style={{ fontSize: '18px' }}>BPVP AMBON</text>
        </g>
      )}
    </svg>
    {showText && (
      <div className="mt-4 text-center">
        <h1 className="text-4xl font-black text-[#003399] tracking-tighter uppercase">SIBER</h1>
        <p className="text-sm font-black text-[#003399] uppercase tracking-widest mt-1">BPVP AMBON</p>
      </div>
    )}
  </div>
);

export default SiberLogo;
