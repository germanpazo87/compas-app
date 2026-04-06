import React, { useState } from 'react';
import {
  TalesClassicSVG,
  TalesShadowSVG,
  TalesSimilarSVG,
} from '../components/geometry/TalesSVG';
import type { TrianglePair } from '../components/geometry/TalesSVG';

export function TalesTestPage() {
  const [selected, setSelected] = useState<0 | 1 | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const pairs: [TrianglePair, TrianglePair] = [
    { sides: [3, 4, 5],  label: 'Parell A' },
    { sides: [3, 5, 7],  label: 'Parell B' },
  ];

  return (
    <div style={{ background: '#ffffff', padding: 24, minHeight: '100vh' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 32, color: '#1e1b4b' }}>
        TalesSVG — pàgina de prova visual
      </h1>

      {/* ── TalesClassicSVG ── */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#4f46e5' }}>
          TalesClassicSVG — a=4, b=6, c=6, d=x
        </h2>
        <div style={{ maxWidth: 420 }}>
          <TalesClassicSVG
            segmentA={4}
            segmentB={6}
            segmentC={6}
            segmentD={9}
            unknownField="segmentD"
          />
        </div>
      </section>

      {/* ── TalesShadowSVG ── */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#4f46e5' }}>
          TalesShadowSVG — a=3, b=5, c=4, d=x
        </h2>
        <div style={{ maxWidth: 420 }}>
          <TalesShadowSVG
            segmentA={3}
            segmentB={5}
            segmentC={4}
            segmentD="x"
            unknownField="segmentD"
          />
        </div>
      </section>

      {/* ── TalesSimilarSVG ── */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#4f46e5' }}>
          TalesSimilarSVG — Parell A [3,4,5] · Parell B [3,5,7]
        </h2>
        <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowAnswer(v => !v)}
            style={{
              padding: '6px 16px',
              background: showAnswer ? '#16a34a' : '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {showAnswer ? 'Amaga resposta' : 'Mostra resposta'}
          </button>
          <button
            onClick={() => setSelected(null)}
            style={{
              padding: '6px 16px',
              background: '#9ca3af',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Desselecciona
          </button>
        </div>
        <div style={{ maxWidth: 620 }}>
          <TalesSimilarSVG
            pairs={pairs}
            selected={selected}
            showAnswer={showAnswer}
            areSimilar={[true, false]}
            onSelect={setSelected}
          />
        </div>
        <p style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
          Seleccionat: {selected === null ? 'cap' : `parell ${selected}`}
          {showAnswer && selected !== null && (
            <> · {[true, false][selected] ? '✓ Semblants' : '✗ No semblants'}</>
          )}
        </p>
      </section>
    </div>
  );
}
