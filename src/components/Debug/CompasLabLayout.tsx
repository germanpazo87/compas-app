// src/components/Debug/CompasLabLayout.tsx
import React, { useState } from 'react';
import { CompasLab } from './CompasLab';

export const CompasLabLayout = ({ children, debugData, exerciseState }: any) => {
  const [showLab, setShowLab] = useState(true);

  return (
    // 1. CONTENIDOR PARE: Força el layout horitzontal i ocupa tot el visor (viewport)
    <div style={{ 
      display: 'flex', 
      flexDirection: 'row', 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      
      {/* 🟦 COLUMNA ESQUERRA: App de l'alumne */}
      <div style={{ 
        width: showLab ? '60%' : '100%', 
        height: '100%', 
        overflowY: 'auto', 
        backgroundColor: '#ffffff',
        transition: 'width 0.3s ease'
      }}>
        {children}
      </div>

      {/* 🟨 COLUMNA DRETA: Panell de Debug (Matrix) */}
      {showLab && (
        <div style={{ 
          width: '40%', 
          height: '100%', 
          backgroundColor: '#050505', // Negre profund forçat
          color: '#22c55e',          // Verd emerald
          borderLeft: '4px solid #1f2937',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'monospace'
        }}>
          {/* Header del Lab */}
          <div style={{ padding: '12px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', backgroundColor: '#000' }}>
            <span style={{ fontWeight: 'bold', fontSize: '12px' }}>
              ● COMPÀS_LAB::KERNEL_V1
            </span>
            <button onClick={() => setShowLab(false)} style={{ color: '#6b7280', fontSize: '12px', cursor: 'pointer' }}>
              [MINIMIZE]
            </button>
          </div>
          
          {/* Contingut del Lab */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <CompasLab debugData={debugData} exerciseState={exerciseState} />
          </div>
        </div>
      )}

      {/* Botó flotant per si el tanques */}
      {!showLab && (
        <button 
          onClick={() => setShowLab(true)}
          style={{ position: 'fixed', bottom: '20px', right: '20px', padding: '12px', backgroundColor: '#000', color: '#22c55e', border: '1px solid #22c55e', borderRadius: '50%', cursor: 'pointer', zIndex: 10000 }}
        >
          🧪
        </button>
      )}
    </div>
  );
};