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
  ground:    '#d1d5db',
  text:      '#1e1b4b',
} as const;

// ---------------------------------------------------------------------------
// TalesClassicSVG
// ---------------------------------------------------------------------------

export interface TalesClassicSVGProps {
  segmentA: number | string;
  segmentB: number | string;
  segmentC: number | string;
  segmentD: number | string;
  unknownField?: string;
}

export function TalesClassicSVG({
  segmentA, segmentB, segmentC, segmentD, unknownField = 'segmentD',
}: TalesClassicSVGProps) {
  const W = 400, H = 300;
  const Y_TOP = 40, Y_BOTTOM = 260;
  // Use numeric values for geometry; fall back to 6 when segment is 'x'
  const numA = typeof segmentA === 'number' ? segmentA : 6;
  const numB = typeof segmentB === 'number' ? segmentB : 6;
  const frac = numA / (numA + numB);
  const Y_MID = Y_TOP + frac * (Y_BOTTOM - Y_TOP);

  // ── Convergent secant geometry ────────────────────────────────────────────
  // Left secant fans left going down; right fans right going down.
  // Both converge toward a vanishing point above the SVG (~200, -86).
  const L_TOP = { x: 160, y: Y_TOP };
  const L_BOT = { x: 90,  y: Y_BOTTOM };
  const R_TOP = { x: 240, y: Y_TOP };
  const R_BOT = { x: 310, y: Y_BOTTOM };

  const L_MID = { x: L_TOP.x + frac * (L_BOT.x - L_TOP.x), y: Y_MID };
  const R_MID = { x: R_TOP.x + frac * (R_BOT.x - R_TOP.x), y: Y_MID };

  // Extend secants past the outermost parallels (visible within the viewBox)
  const ext = 28;
  const span = Y_BOTTOM - Y_TOP;
  const L_EXT_T = { x: L_TOP.x - (ext / span) * (L_BOT.x - L_TOP.x), y: Y_TOP - ext };
  const L_EXT_B = { x: L_BOT.x + (ext / span) * (L_BOT.x - L_TOP.x), y: Y_BOTTOM + ext };
  const R_EXT_T = { x: R_TOP.x - (ext / span) * (R_BOT.x - R_TOP.x), y: Y_TOP - ext };
  const R_EXT_B = { x: R_BOT.x + (ext / span) * (R_BOT.x - R_TOP.x), y: Y_BOTTOM + ext };

  // ── Segment label positions ───────────────────────────────────────────────
  // Left labels offset left; right labels offset right — clear secant ownership
  const OFF = 22;
  const labelA = { x: (L_TOP.x + L_MID.x) / 2 - OFF, y: (L_TOP.y + L_MID.y) / 2 };
  const labelB = { x: (L_MID.x + L_BOT.x) / 2 - OFF, y: (L_MID.y + L_BOT.y) / 2 };
  const labelC = { x: (R_TOP.x + R_MID.x) / 2 + OFF, y: (R_TOP.y + R_MID.y) / 2 };
  const labelD = { x: (R_MID.x + R_BOT.x) / 2 + OFF, y: (R_MID.y + R_BOT.y) / 2 };

  // Any segment passed as the string 'x' renders in red
  const colorA = segmentA === 'x' ? C.incorrect : C.primary;
  const colorB = segmentB === 'x' ? C.incorrect : C.primary;
  const colorC = segmentC === 'x' ? C.incorrect : C.primary;
  const colorD = segmentD === 'x' ? C.incorrect : C.primary;
  const dots   = [L_TOP, L_MID, L_BOT, R_TOP, R_MID, R_BOT];

  // Parallel line x span; arrowheads drawn as polygons at each end
  const PAR_X1 = 20;
  const PAR_X2 = 380;
  const ARR = 8;   // arrowhead depth
  const ARR_H = 4; // arrowhead half-height
  const TICK_X = 200; // center tick position

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md">

      {/* Three parallel lines — dashed with center ticks and end arrowheads */}
      {[Y_TOP, Y_MID, Y_BOTTOM].map((y, i) => (
        <g key={i}>
          {/* Dashed line between arrowheads */}
          <line
            x1={PAR_X1 + ARR} y1={y} x2={PAR_X2 - ARR} y2={y}
            stroke={C.neutral} strokeWidth={1.5} strokeDasharray="6 3"
          />
          {/* Left arrowhead (points left) */}
          <polygon
            points={`${PAR_X1},${y} ${PAR_X1 + ARR},${y - ARR_H} ${PAR_X1 + ARR},${y + ARR_H}`}
            fill={C.neutral}
          />
          {/* Right arrowhead (points right) */}
          <polygon
            points={`${PAR_X2},${y} ${PAR_X2 - ARR},${y - ARR_H} ${PAR_X2 - ARR},${y + ARR_H}`}
            fill={C.neutral}
          />
          {/* Double tick at centre */}
          <line x1={TICK_X - 5} y1={y - 6} x2={TICK_X - 5} y2={y + 6}
            stroke={C.neutral} strokeWidth={1.5} />
          <line x1={TICK_X + 5} y1={y - 6} x2={TICK_X + 5} y2={y + 6}
            stroke={C.neutral} strokeWidth={1.5} />
        </g>
      ))}

      {/* Left secant — extended beyond parallels, clearly converging */}
      <line x1={L_EXT_T.x} y1={L_EXT_T.y} x2={L_EXT_B.x} y2={L_EXT_B.y}
        stroke={C.primary} strokeWidth={2.5} />
      {/* Right secant — symmetric */}
      <line x1={R_EXT_T.x} y1={R_EXT_T.y} x2={R_EXT_B.x} y2={R_EXT_B.y}
        stroke={C.primary} strokeWidth={2.5} />

      {/* Intersection dots */}
      {dots.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={C.primary} />
      ))}

      {/* Segment labels — always visible; unknown segment shown in violet */}
      <text x={labelA.x} y={labelA.y} textAnchor="middle" dominantBaseline="middle"
        fontSize={14} fontWeight="600" fill={colorA}>
        {segmentA === 'x' ? 'a=x' : `a=${segmentA}`}
      </text>
      <text x={labelB.x} y={labelB.y} textAnchor="middle" dominantBaseline="middle"
        fontSize={14} fontWeight="600" fill={colorB}>
        {segmentB === 'x' ? 'b=x' : `b=${segmentB}`}
      </text>
      <text x={labelC.x} y={labelC.y} textAnchor="middle" dominantBaseline="middle"
        fontSize={14} fontWeight="600" fill={colorC}>
        {segmentC === 'x' ? 'c=x' : `c=${segmentC}`}
      </text>
      <text x={labelD.x} y={labelD.y} textAnchor="middle" dominantBaseline="middle"
        fontSize={14} fontWeight="600" fill={colorD}>
        {segmentD === 'x' ? 'd=x' : `d=${segmentD}`}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// TalesShadowSVG — lamp-post/shadow diagram
// Vertex V at bottom-left, two vertical parallels rising from ground,
// hypotenuse from V through both tops, inner horizontal at first top height.
// ---------------------------------------------------------------------------

export interface TalesShadowSVGProps {
  segmentA: number | string;  // personHeight (height of first vertical)
  segmentB: number | string;  // objectHeight - personHeight (extra height)
  segmentC: number | string;  // personShadow (horizontal to first vertical)
  segmentD: number | string;  // objectShadow (horizontal to second vertical)
}

export function TalesShadowSVG({
  segmentA, segmentB, segmentC, segmentD,
}: TalesShadowSVGProps) {
  const V_X = 40, GROUND_Y = 260;

  // Numeric values for geometry — fall back to reasonable defaults when 'x'
  const numA = typeof segmentA === 'number' ? segmentA : 1.8;
  const numB = typeof segmentB === 'number' ? segmentB : numA * 10;
  const numC = typeof segmentC === 'number' ? segmentC : 1.2;
  // Estimate segmentD from proportion when unknown
  const numD = typeof segmentD === 'number'
    ? segmentD
    : numC * (numA + numB) / numA;

  // Uniform scale: heights cap at 200px; horizontal capped to fit viewBox
  const s = Math.min(
    200 / (numA + numB),
    310 / numD,
  );

  const x1 = V_X + numC * s;
  const x2 = V_X + numD * s;
  const y1top  = GROUND_Y - numA * s;
  const y2top  = GROUND_Y - (numA + numB) * s;
  const yInner = y1top;

  // Color pairs: unknown always overrides to red
  const personColor      = segmentA === 'x' ? C.incorrect : '#4f46e5'; // indigo
  const personShadowColor = segmentC === 'x' ? C.incorrect : '#3b82f6'; // blue-500
  const objectColor      = segmentB === 'x' ? C.incorrect : '#059669'; // emerald-600
  const objectShadowColor = segmentD === 'x' ? C.incorrect : '#10b981'; // emerald-500

  const SZ = 7;

  return (
    <svg viewBox="0 0 400 310" className="w-full max-w-md">
      {/* Ground line */}
      <line x1={V_X} y1={GROUND_Y} x2={x2 + 16} y2={GROUND_Y}
        stroke={C.neutral} strokeWidth={2} />

      {/* Hypotenuse: V → top of second vertical */}
      <line x1={V_X} y1={GROUND_Y} x2={x2} y2={y2top}
        stroke={C.primary} strokeWidth={2} />

      {/* Inner horizontal at first vertical's top height */}
      <line x1={x1} y1={yInner} x2={x2} y2={yInner}
        stroke={C.neutral} strokeWidth={1.5} strokeDasharray="5 3" />

      {/* First vertical — personHeight */}
      <line x1={x1} y1={GROUND_Y} x2={x1} y2={y1top}
        stroke={personColor} strokeWidth={2} />

      {/* Person shadow — ground segment V→x1 */}
      <line x1={V_X} y1={GROUND_Y} x2={x1} y2={GROUND_Y}
        stroke={personShadowColor} strokeWidth={3} />

      {/* Second vertical — full objectHeight */}
      <line x1={x2} y1={GROUND_Y} x2={x2} y2={y2top}
        stroke={objectColor} strokeWidth={2} />

      {/* Object shadow — ground segment x1→x2 */}
      <line x1={x1} y1={GROUND_Y} x2={x2} y2={GROUND_Y}
        stroke={objectShadowColor} strokeWidth={3} />

      {/* Right-angle markers */}
      <path d={`M ${x1} ${GROUND_Y - SZ} L ${x1 + SZ} ${GROUND_Y - SZ} L ${x1 + SZ} ${GROUND_Y}`}
        fill="none" stroke={C.neutral} strokeWidth={1.2} />
      <path d={`M ${x2} ${GROUND_Y - SZ} L ${x2 - SZ} ${GROUND_Y - SZ} L ${x2 - SZ} ${GROUND_Y}`}
        fill="none" stroke={C.neutral} strokeWidth={1.2} />

      {/* Tick marks on first vertical */}
      <line x1={x1 - 6} y1={(GROUND_Y + y1top) / 2 - 5} x2={x1 + 6} y2={(GROUND_Y + y1top) / 2 - 5}
        stroke={C.neutral} strokeWidth={1.5} />
      <line x1={x1 - 6} y1={(GROUND_Y + y1top) / 2 + 5} x2={x1 + 6} y2={(GROUND_Y + y1top) / 2 + 5}
        stroke={C.neutral} strokeWidth={1.5} />

      {/* Tick marks on second vertical */}
      <line x1={x2 - 6} y1={(GROUND_Y + y1top) / 2 - 5} x2={x2 + 6} y2={(GROUND_Y + y1top) / 2 - 5}
        stroke={C.neutral} strokeWidth={1.5} />
      <line x1={x2 - 6} y1={(GROUND_Y + y1top) / 2 + 5} x2={x2 + 6} y2={(GROUND_Y + y1top) / 2 + 5}
        stroke={C.neutral} strokeWidth={1.5} />

      {/* Key point dots */}
      <circle cx={V_X} cy={GROUND_Y} r={5} fill={C.primary} />
      <circle cx={x1}  cy={GROUND_Y} r={3} fill={personColor} />
      <circle cx={x1}  cy={y1top}    r={3} fill={personColor} />
      <circle cx={x2}  cy={GROUND_Y} r={3} fill={objectColor} />
      <circle cx={x2}  cy={y2top}    r={3} fill={objectColor} />
      <circle cx={x2}  cy={yInner}   r={3} fill={C.neutral} />

      {/* Labels — heights above ground, shadows below — no overlap possible */}
      <text x={x1 + 10} y={(GROUND_Y + y1top) / 2}
        textAnchor="start" dominantBaseline="middle"
        fontSize={12} fontWeight="600" fill={personColor}>
        {segmentA === 'x' ? 'persona: x' : `persona: ${segmentA}`}
      </text>
      <text x={x2 + 10} y={(GROUND_Y + y2top) / 2}
        textAnchor="start" dominantBaseline="middle"
        fontSize={12} fontWeight="600" fill={objectColor}>
        {segmentB === 'x' ? 'objecte: x' : `objecte: ${segmentB}`}
      </text>
      <text x={(V_X + x1) / 2} y={GROUND_Y + 16}
        textAnchor="middle" dominantBaseline="hanging"
        fontSize={12} fontWeight="600" fill={personShadowColor}>
        {segmentC === 'x' ? 'ombra p.: x' : `ombra p.: ${segmentC}`}
      </text>
      <text x={(x1 + x2) / 2} y={GROUND_Y + 30}
        textAnchor="middle" dominantBaseline="hanging"
        fontSize={12} fontWeight="600" fill={objectShadowColor}>
        {segmentD === 'x' ? 'ombra obj.: x' : `ombra obj.: ${segmentD}`}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// TalesSimilarSVG — helpers
// ---------------------------------------------------------------------------

type Vertex = [number, number];
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
  const xs = tri.map(v => v[0]);
  const ys = tri.map(v => v[1]);
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

function perp(a: Vertex, b: Vertex, d: number): Vertex {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return [-dy / len * d, dx / len * d];
}

interface TriangleShapeProps {
  sides: [number, number, number];
  cx: number;
  cy: number;
  color: string;
}

function TriangleShape({ sides, cx, cy, color }: TriangleShapeProps) {
  const [a, b, c] = sides;
  const verts  = scaleAndCenter(computeTriangleVertices(a, b, c), 120, 95, cx, cy);
  const [V0, V1, V2] = verts;
  const pts    = verts.map(v => `${v[0].toFixed(1)},${v[1].toFixed(1)}`).join(' ');
  const OFF    = 14;

  const mC = midpt(V0, V1); const [ox_c, oy_c] = perp(V0, V1, -OFF);
  const mA = midpt(V1, V2); const [ox_a, oy_a] = perp(V1, V2, -OFF);
  const mB = midpt(V2, V0); const [ox_b, oy_b] = perp(V2, V0, -OFF);

  return (
    <g>
      <polygon points={pts} fill={`${color}20`} stroke={color} strokeWidth={2} />
      <text x={mC[0] + ox_c} y={mC[1] + oy_c}
        textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="600" fill={color}>{c}</text>
      <text x={mA[0] + ox_a} y={mA[1] + oy_a}
        textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="600" fill={color}>{a}</text>
      <text x={mB[0] + ox_b} y={mB[1] + oy_b}
        textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="600" fill={color}>{b}</text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// TalesSimilarSVG
// ---------------------------------------------------------------------------

export interface TrianglePair {
  sides: [number, number, number];
  label?: string;
}

export interface TalesSimilarSVGProps {
  pairs: [TrianglePair, TrianglePair];
  selected?: 0 | 1 | null;
  showAnswer?: boolean;
  areSimilar?: [boolean, boolean];
  onSelect?: (index: 0 | 1) => void;
}

export function TalesSimilarSVG({
  pairs,
  selected = null,
  showAnswer = false,
  areSimilar,
  onSelect,
}: TalesSimilarSVGProps) {
  const W = 600, H = 300;
  const centres: [number, number][] = [[150, 148], [450, 148]];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl">
      {/* Centre divider */}
      <line x1={300} y1={8} x2={300} y2={292}
        stroke={C.neutral} strokeWidth={1} strokeDasharray="5 4" />

      {pairs.map((pair, i) => {
        const [cx, cy] = centres[i];
        let color = C.primary;
        if (showAnswer && areSimilar) {
          color = areSimilar[i] ? C.correct : C.incorrect;
        } else if (selected === i) {
          color = C.unknown;
        }

        const halfX = i === 0 ? 5 : 305;

        return (
          <g
            key={i}
            onClick={() => onSelect?.(i as 0 | 1)}
            style={{ cursor: onSelect ? 'pointer' : 'default' }}
          >
            {/* Selection highlight */}
            {selected === i && (
              <rect x={halfX} y={5} width={290} height={290}
                rx={8} fill="none"
                stroke={color} strokeWidth={2} strokeDasharray="6 3"
              />
            )}
            <TriangleShape sides={pair.sides} cx={cx} cy={cy} color={color} />
            {pair.label && (
              <text x={cx} y={cy + 112}
                textAnchor="middle" fontSize={12} fill={C.text} fontWeight="600">
                {pair.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// TalesInaccessibleSVG — inaccessible distance diagram
// Observer at V (bottom centre), two secants crossing an obstacle line,
// reaching targets T1 and T2.  Proportion: seg1/seg2 = seg3/seg4.
// Static layout — values are labels only; geometry never deforms.
// ---------------------------------------------------------------------------

export interface TalesInaccessibleSVGProps {
  seg1: number | string;  // PA: observer P → stake A (left secant, near portion)
  seg2: number | string;  // AB: stake A → stake B (horizontal span at obstacle level)
  seg3: number | string;  // PC: observer P → target C (full left secant)
  seg4: number | string;  // CD: target C → target D (inaccessible distance)
  showLabels?: boolean;   // true (default): show numeric values; false: show names only
}

export function TalesInaccessibleSVG({ seg1, seg2, seg3, seg4, showLabels = true }: TalesInaccessibleSVGProps) {
  // Static geometry — P1 and P2 are collinear secant intersections at OBS_Y.
  // t = (285-145)/(285-45) = 7/12.
  const P  = { x: 200, y: 285 };  // observer
  const C_ = { x: 80,  y: 45  };  // near target  (C — underscore avoids clash with React)
  const D  = { x: 320, y: 45  };  // far target
  const A  = { x: 130, y: 145 };  // first stake  (P→C at OBS_Y: 200+7/12*(80-200)=130)
  const B  = { x: 270, y: 145 };  // second stake (P→D at OBS_Y: 200+7/12*(320-200)=270)

  const colPA = seg1 === 'x' ? C.incorrect : C.primary;
  const colAB = seg2 === 'x' ? C.incorrect : C.primary;
  const colPC = seg3 === 'x' ? C.incorrect : '#059669';
  const colCD = seg4 === 'x' ? C.incorrect : '#059669';

  // Segment label helpers
  const lbl = (name: string, val: number | string) =>
    val === 'x' ? 'x' : showLabels ? `${name}=${val}` : name;

  // Midpoints for labels
  const midPA = { x: (P.x + A.x) / 2, y: (P.y + A.y) / 2 };   // (165, 215)
  const midPC = { x: (P.x + C_.x) / 2, y: (P.y + C_.y) / 2 }; // (140, 165)

  return (
    <svg viewBox="0 0 400 310" className="w-full max-w-md">

      {/* Full secants P→C and P→D */}
      <line x1={P.x} y1={P.y} x2={C_.x} y2={C_.y} stroke={C.primary} strokeWidth={2} />
      <line x1={P.x} y1={P.y} x2={D.x}  y2={D.y}  stroke="#059669"   strokeWidth={2} />

      {/* Inaccessible distance line C→D */}
      <line x1={C_.x} y1={C_.y} x2={D.x} y2={D.y} stroke={colCD} strokeWidth={2.5} />

      {/* Obstacle line — dashed across */}
      <line x1={50} y1={A.y} x2={350} y2={B.y}
        stroke={C.neutral} strokeWidth={1.5} strokeDasharray="8 4" />
      <text x={355} y={A.y} dominantBaseline="middle"
        fontSize={11} fontStyle="italic" fill={C.neutral}>obstacle</text>

      {/* Key dots */}
      {[P, C_, D, A, B].map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={4} fill={i < 3 ? C.primary : C.neutral} />
      ))}

      {/* Point labels P, C, D, A, B */}
      <text x={P.x + 10}  y={P.y - 6}  textAnchor="start" dominantBaseline="middle"
        fontSize={12} fontWeight="700" fill={C.text}>P</text>
      <text x={C_.x}      y={C_.y - 12} textAnchor="middle"
        fontSize={12} fontWeight="700" fill={C.primary}>C</text>
      <text x={D.x}       y={D.y - 12}  textAnchor="middle"
        fontSize={12} fontWeight="700" fill="#059669">D</text>
      <text x={A.x - 10}  y={A.y}       textAnchor="end"   dominantBaseline="middle"
        fontSize={11} fontWeight="600" fill={C.neutral}>A</text>
      <text x={B.x + 10}  y={B.y}       textAnchor="start" dominantBaseline="middle"
        fontSize={11} fontWeight="600" fill={C.neutral}>B</text>

      {/* Segment label: PA — midpoint P→A, left of left secant */}
      <text x={midPA.x - 14} y={midPA.y} textAnchor="end" dominantBaseline="middle"
        fontSize={13} fontWeight="700" fill={colPA}>
        {lbl('PA', seg1)}
      </text>

      {/* Segment label: AB — above obstacle line between A and B */}
      <text x={(A.x + B.x) / 2} y={A.y - 10} textAnchor="middle"
        fontSize={13} fontWeight="700" fill={colAB}>
        {lbl('AB', seg2)}
      </text>

      {/* Segment label: PC — midpoint P→C, left of left secant (above PA, no overlap) */}
      <text x={midPC.x - 14} y={midPC.y} textAnchor="end" dominantBaseline="middle"
        fontSize={13} fontWeight="700" fill={colPC}>
        {lbl('PC', seg3)}
      </text>

      {/* Segment label: CD — above C→D line */}
      <text x={(C_.x + D.x) / 2} y={C_.y - 12} textAnchor="middle"
        fontSize={13} fontWeight="700" fill={colCD}>
        {lbl('CD', seg4)}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// TalesDiagram — unified dispatcher
// ---------------------------------------------------------------------------

export type TalesDiagramType = 'classic' | 'shadow' | 'similar' | 'inaccessible';

type TalesDiagramProps =
  | ({ type: 'classic'      } & TalesClassicSVGProps)
  | ({ type: 'shadow'       } & TalesShadowSVGProps)
  | ({ type: 'similar'      } & TalesSimilarSVGProps)
  | ({ type: 'inaccessible' } & TalesInaccessibleSVGProps);

export function TalesDiagram(props: TalesDiagramProps) {
  if (props.type === 'classic') {
    return (
      <TalesClassicSVG
        segmentA={props.segmentA}
        segmentB={props.segmentB}
        segmentC={props.segmentC}
        segmentD={props.segmentD}
        unknownField={props.unknownField}
      />
    );
  }
  if (props.type === 'shadow') {
    return (
      <TalesShadowSVG
        segmentA={props.segmentA}
        segmentB={props.segmentB}
        segmentC={props.segmentC}
        segmentD={props.segmentD}
      />
    );
  }
  if (props.type === 'inaccessible') {
    return (
      <TalesInaccessibleSVG
        seg1={props.seg1}
        seg2={props.seg2}
        seg3={props.seg3}
        seg4={props.seg4}
        showLabels={props.showLabels}
      />
    );
  }
  return (
    <TalesSimilarSVG
      pairs={props.pairs}
      selected={props.selected}
      showAnswer={props.showAnswer}
      areSimilar={props.areSimilar}
      onSelect={props.onSelect}
    />
  );
}
