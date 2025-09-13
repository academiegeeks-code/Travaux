import React from "react";
import "./WaveLine.css";

export default function WaveLine() {
  return (
    <div className="waveline-container">
      <svg 
        className="luxury-waveline" 
        width="100%" 
        height="120" 
        viewBox="0 0 1200 120" 
        preserveAspectRatio="none"
      >
        {/* Ligne principale avec dégradé doré */}
        <path
          d="M0,80 C150,40 300,100 450,60 S750,100 900,60 S1050,100 1200,60 L1200,120 L0,120 Z"
          fill="url(#gold-gradient)"
          opacity="0.8"
        />
        
        {/* Deuxième ligne pour la profondeur */}
        <path
          d="M0,90 C150,50 300,110 450,70 S750,110 900,70 S1050,110 1200,70 L1200,120 L0,120 Z"
          fill="url(#light-gold-gradient)"
          opacity="0.6"
        />
        
        {/* Reflets */}
        <path
          d="M0,75 C100,60 250,85 400,65 S650,85 800,65 S950,85 1100,65 L1200,65 L1200,85 L0,85 Z"
          fill="url(#shine-gradient)"
          opacity="0.3"
        />
        
        <defs>
          {/* Dégradé doré principal */}
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.7" />
            <stop offset="25%" stopColor="#FFA800" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FFD700" stopOpacity="0.9" />
            <stop offset="75%" stopColor="#FFA800" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0.7" />
          </linearGradient>
          
          {/* Dégradé doré clair */}
          <linearGradient id="light-gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFF9C4" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#FFECB3" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFF9C4" stopOpacity="0.5" />
          </linearGradient>
          
          {/* Dégradé pour les reflets */}
          <linearGradient id="shine-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
          </linearGradient>
          
          {/* Effet d'ombre portée subtile */}
          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.15"/>
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#FFD700" floodOpacity="0.2"/>
          </filter>
        </defs>
      </svg>
    </div>
  );
}