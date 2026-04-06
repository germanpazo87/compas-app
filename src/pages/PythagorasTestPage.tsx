import React, { useState } from 'react';
import {
  PythagorasTriangleSVG,
  PythagorasIdentifySVG,
  PythagorasHypotenuseSVG,
} from '../components/geometry/PythagorasSVG';

export function PythagorasTestPage() {
  const [identifySelected,    setIdentifySelected]    = useState<number | null>(null);
  const [identifyShowAnswer,  setIdentifyShowAnswer]  = useState(false);
  const [hypSelectedSide,     setHypSelectedSide]     = useState<1 | 2 | 3 | null>(null);
  const [hypShowAnswer,       setHypShowAnswer]       = useState(false);

  return (
    <div style={{ background: '#ffffff', padding: 24, minHeight: '100vh' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 32, color: '#1e1b4b' }}>
        PythagorasSVG — pàgina de prova visual
      </h1>

      {/* ── PythagorasTriangleSVG ── */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#4f46e5' }}>
          PythagorasTriangleSVG — a=3, b=4, c=x
        </h2>
        <div style={{ maxWidth: 420 }}>
          <PythagorasTriangleSVG
            legA={3}
            legB={4}
            hypotenuse={5}
            unknownSide="hypotenuse"
          />
        </div>
      </section>

      {/* ── PythagorasIdentifySVG ── */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#4f46e5' }}>
          PythagorasIdentifySVG — quin triangle és rectangle?
        </h2>
        <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
          <button
            onClick={() => setIdentifyShowAnswer(v => !v)}
            style={{
              padding: '6px 16px',
              background: identifyShowAnswer ? '#16a34a' : '#4f46e5',
              color: '#fff', border: 'none', borderRadius: 6,
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            {identifyShowAnswer ? 'Amaga resposta' : 'Mostra resposta'}
          </button>
          <button
            onClick={() => setIdentifySelected(null)}
            style={{
              padding: '6px 16px', background: '#9ca3af',
              color: '#fff', border: 'none', borderRadius: 6,
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            Desselecciona
          </button>
        </div>
        <div style={{ maxWidth: 620 }}>
          <PythagorasIdentifySVG
            triangles={[
              { a: 3, b: 4, c: 5 },
              { a: 4, b: 6, c: 8 },
              { a: 5, b: 7, c: 9 },
            ]}
            selectedIndex={identifySelected}
            showAnswer={identifyShowAnswer}
            correctIndex={0}
            onSelect={(i) => setIdentifySelected(i)}
          />
        </div>
        <p style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
          Seleccionat: {identifySelected === null ? 'cap' : `Triangle ${identifySelected + 1}`}
          {identifyShowAnswer && identifySelected !== null && (
            <> · {identifySelected === 0 ? '✓ Correcte' : '✗ Incorrecte'}</>
          )}
        </p>
      </section>

      {/* ── PythagorasHypotenuseSVG ── */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#4f46e5' }}>
          PythagorasHypotenuseSVG — quin és l'hipotenusa? (5, 12, 13)
        </h2>
        <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
          <button
            onClick={() => setHypShowAnswer(v => !v)}
            style={{
              padding: '6px 16px',
              background: hypShowAnswer ? '#16a34a' : '#4f46e5',
              color: '#fff', border: 'none', borderRadius: 6,
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            {hypShowAnswer ? 'Amaga resposta' : 'Mostra resposta'}
          </button>
          <button
            onClick={() => setHypSelectedSide(null)}
            style={{
              padding: '6px 16px', background: '#9ca3af',
              color: '#fff', border: 'none', borderRadius: 6,
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            Desselecciona
          </button>
        </div>
        <div style={{ maxWidth: 420 }}>
          <PythagorasHypotenuseSVG
            sideA={5}
            sideB={12}
            sideC={13}
            rotation={0}
            selectedSide={hypSelectedSide}
            showAnswer={hypShowAnswer}
            hypotenuse={3}
            onSelect={(s) => setHypSelectedSide(s)}
          />
        </div>
        <p style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
          Seleccionat: {hypSelectedSide === null ? 'cap' : `Costat ${hypSelectedSide}`}
          {hypShowAnswer && hypSelectedSide !== null && (
            <> · {hypSelectedSide === 3 ? '✓ Correcte' : '✗ Incorrecte'}</>
          )}
        </p>
      </section>
    </div>
  );
}
