import React from 'react';

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const C = {
  primary:   '#4f46e5',
  unknown:   '#7c3aed',
  correct:   '#16a34a',
  incorrect: '#dc2626',
  neutral:   '#9ca3af',
  text:      '#1e1b4b',
} as const;

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

type Vertex   = [number, number];
type Triangle = [Vertex, Vertex, Vertex];

/** Compute V0=(0,0), V1=(c,0), V2 from sides a=V1-V2, b=V0-V2, c=V0-V1 */
function computeTriangleVertices(a: number, b: number, c: number): Triangle {
  const cosV0 = (b * b + c * c - a * a) / (2 * b * c);
  const angle  = Math.acos(Math.max(-1, Math.min(1, cosV0)));
  return [
    [0, 0],
    [c, 0],
    [b * Math.cos(angle), b * Math.sin(angle)],
  ];
}

function scaleAndCenter(tri: Triangle, targetW: number, targetH: number, cx: number, cy: number): Triangle {
  const xs   = tri.map(v => v[0]);
  const ys   = tri.map(v => v[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w    = maxX - minX || 1;
  const h    = maxY - minY || 1;
  const s    = Math.min(targetW / w, targetH / h) * 0.82;
  const ox   = cx - (minX + w / 2) * s;
  const oy   = cy - (minY + h / 2) * s;
  return tri.map(([x, y]): Vertex => [x * s + ox, y * s + oy]) as Triangle;
}

function midpt(a: Vertex, b: Vertex): Vertex {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/** Returns a perpendicular offset vector of length |d| rotated 90° from segment a→b */
function perp(a: Vertex, b: Vertex, d: number): Vertex {
  const dx  = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return [-dy / len * d, dx / len * d];
}

/** SVG path string for a right-angle square marker at P, opening toward Q and R */
function rightAngleMarker(P: Vertex, Q: Vertex, R: Vertex, sz: number): string {
  const ux = Q[0] - P[0], uy = Q[1] - P[1];
  const uL = Math.sqrt(ux * ux + uy * uy) || 1;
  const vx = R[0] - P[0], vy = R[1] - P[1];
  const vL = Math.sqrt(vx * vx + vy * vy) || 1;
  const u  = [ux / uL * sz, uy / uL * sz];
  const v  = [vx / vL * sz, vy / vL * sz];
  const p1 = `${(P[0] + u[0]).toFixed(1)} ${(P[1] + u[1]).toFixed(1)}`;
  const p2 = `${(P[0] + u[0] + v[0]).toFixed(1)} ${(P[1] + u[1] + v[1]).toFixed(1)}`;
  const p3 = `${(P[0] + v[0]).toFixed(1)} ${(P[1] + v[1]).toFixed(1)}`;
  return `M ${p1} L ${p2} L ${p3}`;
}

/**
 * Right-angle marker for a right triangle given which side number is the hypotenuse.
 * Side mapping: 1=sideA (V1-V2), 2=sideB (V2-V0), 3=sideC (V0-V1).
 * Right angle is at the vertex OPPOSITE the hypotenuse.
 */
function hypotenuseRightAngleMarker(verts: Triangle, hyp: 1 | 2 | 3, sz: number): string {
  const [V0, V1, V2] = verts;
  switch (hyp) {
    case 1: return rightAngleMarker(V0, V1, V2, sz);
    case 2: return rightAngleMarker(V1, V0, V2, sz);
    case 3: return rightAngleMarker(V2, V0, V1, sz);
  }
}

// ---------------------------------------------------------------------------
// PythagorasTriangleSVG
// ---------------------------------------------------------------------------

export interface PythagorasTriangleSVGProps {
  legA: number;
  legB: number;
  hypotenuse: number;
  unknownSide: 'legA' | 'legB' | 'hypotenuse' | 'none';
  showRightAngle?: boolean;
  rotation?: 0 | 90 | 180 | 270;
  showLabels?: boolean;   // when false, side value labels are hidden (default true)
  // Stepped exercise interaction
  stepMode?: 'click_corner' | 'click_side';
  onElementClick?: (id: string) => void;
  selectedElement?: string | null;
  correctElement?: string | null;
}

/**
 * Right triangle with the right angle at bottom-left (in local coordinates).
 * legA runs horizontally (bottom), legB runs vertically (left side),
 * hypotenuse connects top-left to bottom-right.
 *
 * The optional `rotation` prop rotates the geometry around the SVG centre so
 * the triangle appears in different orientations for pedagogical variety.
 * Labels are rendered outside the rotated group and stay upright.
 * Click hit areas rotate WITH the geometry so interactions remain accurate.
 *
 * The right-angle corner is always 'corner_BL' in local coordinates regardless
 * of rotation — callers should use this invariant when checking answers.
 */
export function PythagorasTriangleSVG({
  legA, legB, hypotenuse, unknownSide, showRightAngle = true,
  showLabels = true,
  rotation = 0,
  stepMode, onElementClick, selectedElement, correctElement,
}: PythagorasTriangleSVGProps) {
  // ── Local geometry (unrotated) ──────────────────────────────────────────
  const CX = 200, CY = 150; // SVG centre — rotation pivot
  const BL: Vertex = [60, 250];
  const scale      = Math.min(280 / legA, 180 / legB);
  const BR: Vertex = [BL[0] + legA * scale, BL[1]];
  const TL: Vertex = [BL[0], BL[1] - legB * scale];
  const SZ = 8;

  const colorA = unknownSide === 'legA'       ? C.unknown : C.primary;
  const colorB = unknownSide === 'legB'       ? C.unknown : C.primary;
  const colorH = unknownSide === 'hypotenuse' ? C.unknown : C.primary;

  const labelA = unknownSide === 'legA'       ? 'x' : `a=${legA}`;
  const labelB = unknownSide === 'legB'       ? 'x' : `b=${legB}`;
  const labelH = unknownSide === 'hypotenuse' ? 'x' : `c=${hypotenuse}`;

  // ── Rotate a point around (CX, CY) for upright label placement ─────────
  function rotPt(p: Vertex): Vertex {
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const dx = p[0] - CX, dy = p[1] - CY;
    return [CX + dx * cos - dy * sin, CY + dx * sin + dy * cos];
  }

  // Rotated vertex positions (for label placement only — geometry stays local)
  const rBL = rotPt(BL);
  const rBR = rotPt(BR);
  const rTL = rotPt(TL);

  // Hypotenuse label: offset perpendicular from rotated midpoint, away from rBL
  const rMidH     = rotPt(midpt(TL, BR));
  const rFrom     = rotPt(TL);
  const rTo       = rotPt(BR);
  const [ox, oy]  = perp(rFrom, rTo, 18);
  const d1 = (rMidH[0] + ox - rBL[0]) ** 2 + (rMidH[1] + oy - rBL[1]) ** 2;
  const d2 = (rMidH[0] - ox - rBL[0]) ** 2 + (rMidH[1] - oy - rBL[1]) ** 2;
  const hLx = d1 > d2 ? rMidH[0] + ox : rMidH[0] - ox;
  const hLy = d1 > d2 ? rMidH[1] + oy : rMidH[1] - oy;

  return (
    <svg viewBox="0 0 400 300" className="w-full max-w-md">

      {/* ── Rotated group: geometry + hit areas ─────────────────────────── */}
      <g transform={`rotate(${rotation}, ${CX}, ${CY})`}>

        {/* Edges */}
        <line x1={BL[0]} y1={BL[1]} x2={BR[0]} y2={BR[1]} stroke={colorA} strokeWidth={2.5} />
        <line x1={BL[0]} y1={BL[1]} x2={TL[0]} y2={TL[1]} stroke={colorB} strokeWidth={2.5} />
        <line x1={TL[0]} y1={TL[1]} x2={BR[0]} y2={BR[1]} stroke={colorH} strokeWidth={2.5} />

        {/* Right-angle marker at BL */}
        {showRightAngle && (
          <path
            d={`M ${BL[0] + SZ} ${BL[1]} L ${BL[0] + SZ} ${BL[1] - SZ} L ${BL[0]} ${BL[1] - SZ}`}
            fill="none" stroke={C.neutral} strokeWidth={1.5}
          />
        )}

        {/* Vertex dots */}
        <circle cx={BL[0]} cy={BL[1]} r={4} fill={C.primary} />
        <circle cx={BR[0]} cy={BR[1]} r={4} fill={C.primary} />
        <circle cx={TL[0]} cy={TL[1]} r={4} fill={C.primary} />

        {/* ── click_corner hit areas (rotate with geometry) ─────────────── */}
        {stepMode === 'click_corner' && (
          <>
            {([
              { id: 'corner_BL', pt: BL },
              { id: 'corner_BR', pt: BR },
              { id: 'corner_TL', pt: TL },
            ] as const).map(({ id, pt }) => {
              const isSelected = selectedElement === id;
              const isCorrect  = correctElement  === id;
              const isWrong    = correctElement != null && isSelected && !isCorrect;
              const stroke     = isCorrect ? C.correct : isWrong ? C.incorrect : isSelected ? C.unknown : C.neutral;
              return (
                <circle
                  key={id}
                  cx={pt[0]} cy={pt[1]} r={20}
                  fill="transparent"
                  stroke={stroke}
                  strokeWidth={isSelected || isCorrect || isWrong ? 3 : 1.5}
                  strokeDasharray={isSelected || isCorrect || isWrong ? undefined : '4 3'}
                  onClick={() => onElementClick?.(id)}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
          </>
        )}

        {/* ── click_side hit areas (rotate with geometry) ───────────────── */}
        {stepMode === 'click_side' && (
          <>
            {([
              { id: 'legA',       from: BL, to: BR },
              { id: 'legB',       from: BL, to: TL },
              { id: 'hypotenuse', from: TL, to: BR },
            ] as const).map(({ id, from, to }) => {
              const isSelected = selectedElement === id;
              const isCorrect  = correctElement  === id;
              const isWrong    = correctElement != null && isSelected && !isCorrect;
              const stroke     = isCorrect ? C.correct : isWrong ? C.incorrect : isSelected ? C.unknown : 'transparent';
              return (
                <g key={id}>
                  <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}
                    stroke={stroke} strokeWidth={5} strokeLinecap="round" />
                  <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}
                    stroke="transparent" strokeWidth={18}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onElementClick?.(id)} />
                </g>
              );
            })}
          </>
        )}
      </g>

      {/* ── Upright labels (outside rotated group, use rotated positions) ── */}
      {showLabels && (
        <>
          <text x={(rBL[0] + rBR[0]) / 2} y={(rBL[1] + rBR[1]) / 2 + 18}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={14} fontWeight="600" fill={colorA}>{labelA}</text>
          <text x={rBL[0] - 14} y={(rBL[1] + rTL[1]) / 2}
            textAnchor="end" dominantBaseline="middle"
            fontSize={14} fontWeight="600" fill={colorB}>{labelB}</text>
          <text x={hLx} y={hLy}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={14} fontWeight="600" fill={colorH}>{labelH}</text>
        </>
      )}

    </svg>
  );
}

// ---------------------------------------------------------------------------
// PythagorasIdentifySVG
// ---------------------------------------------------------------------------

const IDENTIFY_CENTRES: readonly [number, number][] = [
  [95, 130], [300, 130], [505, 130],
];
const IDENTIFY_PANELS: readonly [number, number, number, number][] = [
  [5, 5, 185, 270],
  [205, 5, 185, 270],
  [405, 5, 185, 270],
];

export interface PythagorasIdentifySVGProps {
  triangles: Array<{ a: number; b: number; c: number; rotation?: number }>;
  selectedIndex: number | null;
  showAnswer: boolean;
  correctIndex: number;
  onSelect: (index: number) => void;
}

/**
 * Three triangles side by side — student clicks the right triangle.
 * No side labels; identification is purely visual.
 */
export function PythagorasIdentifySVG({
  triangles, selectedIndex, showAnswer, correctIndex, onSelect,
}: PythagorasIdentifySVGProps) {
  const tris = triangles.slice(0, 3);

  return (
    <svg viewBox="0 0 600 280" className="w-full max-w-2xl">
      {tris.map((t, i) => {
        const [cx, cy]         = IDENTIFY_CENTRES[i];
        const [rx, ry, rw, rh] = IDENTIFY_PANELS[i];

        let color = C.primary;
        if (showAnswer) {
          color = i === correctIndex ? C.correct : C.incorrect;
        } else if (selectedIndex === i) {
          color = C.unknown;
        }

        const verts = scaleAndCenter(computeTriangleVertices(t.a, t.b, t.c), 150, 110, cx, cy);
        const pts   = verts.map(v => `${v[0].toFixed(1)},${v[1].toFixed(1)}`).join(' ');

        return (
          <g key={i} onClick={() => onSelect(i)} style={{ cursor: 'pointer' }}>
            {selectedIndex === i && (
              <rect x={rx} y={ry} width={rw} height={rh}
                rx={8} fill="none"
                stroke={color} strokeWidth={2} strokeDasharray="6 3" />
            )}
            <g transform={`rotate(${t.rotation ?? 0}, ${cx}, ${cy})`}>
              <polygon points={pts} fill={`${color}20`} stroke={color} strokeWidth={2.5} />
            </g>
            <text x={cx} y={cy + 90}
              textAnchor="middle" fontSize={13} fontWeight="600" fill={C.text}>
              Triangle {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// PythagorasHypotenuseSVG
// ---------------------------------------------------------------------------

export interface PythagorasHypotenuseSVGProps {
  sideA: number;
  sideB: number;
  sideC: number;
  rotation: number;
  selectedSide: 1 | 2 | 3 | null;
  showAnswer: boolean;
  hypotenuse: 1 | 2 | 3;
  onSelect: (side: 1 | 2 | 3) => void;
}

/**
 * Right triangle with clickable sides. Student taps the hypotenuse.
 * Rotation (0/90/180/270) rotates the triangle shape only; labels stay upright.
 * Side mapping: 1=sideA (V1-V2), 2=sideB (V2-V0), 3=sideC (V0-V1).
 */
export function PythagorasHypotenuseSVG({
  sideA, sideB, sideC, rotation, selectedSide, showAnswer, hypotenuse, onSelect,
}: PythagorasHypotenuseSVGProps) {
  const CX = 200, CY = 150;

  const scaledVerts = scaleAndCenter(
    computeTriangleVertices(sideA, sideB, sideC),
    260, 200, CX, CY,
  );
  const [V0, V1, V2] = scaledVerts;

  const edgePairs: [Vertex, Vertex][] = [[V1, V2], [V2, V0], [V0, V1]];
  const SIDES = [1, 2, 3] as const;

  function sideColor(s: 1 | 2 | 3): string {
    if (showAnswer)         return s === hypotenuse ? C.correct : C.incorrect;
    if (selectedSide === s) return C.unknown;
    return C.primary;
  }

  // Rotate a point around the SVG centre — used to compute upright label positions
  function rotPt(p: Vertex): Vertex {
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const dx = p[0] - CX, dy = p[1] - CY;
    return [CX + dx * cos - dy * sin, CY + dx * sin + dy * cos];
  }

  const rV0 = rotPt(V0), rV1 = rotPt(V1), rV2 = rotPt(V2);
  const rEdgePairs: [Vertex, Vertex][] = [[rV1, rV2], [rV2, rV0], [rV0, rV1]];

  const raPath = hypotenuseRightAngleMarker(scaledVerts, hypotenuse, 8);

  return (
    <svg viewBox="0 0 400 300" className="w-full max-w-md">
      {/* Rotated group: edges, hitboxes, right-angle marker, vertex dots */}
      <g transform={`rotate(${rotation}, ${CX}, ${CY})`}>
        {SIDES.map((s, i) => {
          const [from, to] = edgePairs[i];
          return (
            <g key={s}>
              <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}
                stroke={sideColor(s)} strokeWidth={3} />
              {/* Transparent wide hitbox for easy clicking */}
              <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}
                stroke="transparent" strokeWidth={16}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelect(s)} />
            </g>
          );
        })}
        <path d={raPath} fill="none" stroke={C.neutral} strokeWidth={1.5} />
        <circle cx={V0[0]} cy={V0[1]} r={4} fill={C.primary} />
        <circle cx={V1[0]} cy={V1[1]} r={4} fill={C.primary} />
        <circle cx={V2[0]} cy={V2[1]} r={4} fill={C.primary} />
      </g>

    </svg>
  );
}

// ---------------------------------------------------------------------------
// PythagorasDiagram — unified dispatcher
// ---------------------------------------------------------------------------

export type PythagorasDiagramType = 'triangle' | 'identify' | 'hypotenuse_id';

export type PythagorasDiagramProps =
  | ({ type: 'triangle'      } & PythagorasTriangleSVGProps)
  | ({ type: 'identify'      } & PythagorasIdentifySVGProps)
  | ({ type: 'hypotenuse_id' } & PythagorasHypotenuseSVGProps);

export function PythagorasDiagram(props: PythagorasDiagramProps) {
  if (props.type === 'triangle') {
    return (
      <PythagorasTriangleSVG
        legA={props.legA}
        legB={props.legB}
        hypotenuse={props.hypotenuse}
        unknownSide={props.unknownSide}
        showRightAngle={props.showRightAngle}
      />
    );
  }
  if (props.type === 'identify') {
    return (
      <PythagorasIdentifySVG
        triangles={props.triangles}
        selectedIndex={props.selectedIndex}
        showAnswer={props.showAnswer}
        correctIndex={props.correctIndex}
        onSelect={props.onSelect}
      />
    );
  }
  return (
    <PythagorasHypotenuseSVG
      sideA={props.sideA}
      sideB={props.sideB}
      sideC={props.sideC}
      rotation={props.rotation}
      selectedSide={props.selectedSide}
      showAnswer={props.showAnswer}
      hypotenuse={props.hypotenuse}
      onSelect={props.onSelect}
    />
  );
}
