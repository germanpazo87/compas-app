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
  segmentA: number;
  segmentB: number;
  segmentC: number;
  segmentD: number;
  unknownField?: string;
}

export function TalesClassicSVG({
  segmentA, segmentB, segmentC, segmentD, unknownField = 'segmentD',
}: TalesClassicSVGProps) {
  const W = 400, H = 300;
  const Y_TOP = 40, Y_BOTTOM = 260;
  const frac = segmentA / (segmentA + segmentB);
  const Y_MID = Y_TOP + frac * (Y_BOTTOM - Y_TOP);

  // Two secants
  const L_TOP = { x: 90,  y: Y_TOP };
  const L_BOT = { x: 130, y: Y_BOTTOM };
  const R_TOP = { x: 270, y: Y_TOP };
  const R_BOT = { x: 330, y: Y_BOTTOM };

  const L_MID = { x: L_TOP.x + frac * (L_BOT.x - L_TOP.x), y: Y_MID };
  const R_MID = { x: R_TOP.x + frac * (R_BOT.x - R_TOP.x), y: Y_MID };

  // Segment labels: midpoints offset away from centre
  const labelA = { x: (L_TOP.x + L_MID.x) / 2 - 18, y: (Y_TOP    + Y_MID)    / 2 };
  const labelB = { x: (L_MID.x + L_BOT.x) / 2 - 18, y: (Y_MID    + Y_BOTTOM) / 2 };
  const labelC = { x: (R_TOP.x + R_MID.x) / 2 + 18, y: (Y_TOP    + Y_MID)    / 2 };
  const labelD = { x: (R_MID.x + R_BOT.x) / 2 + 18, y: (Y_MID    + Y_BOTTOM) / 2 };

  const colorD = unknownField === 'segmentD' ? C.unknown : C.primary;
  const dots   = [L_TOP, L_MID, L_BOT, R_TOP, R_MID, R_BOT];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md">
      {/* Three parallel lines */}
      {[Y_TOP, Y_MID, Y_BOTTOM].map((y, i) => (
        <g key={i}>
          <line x1={40} y1={y} x2={360} y2={y} stroke={C.neutral} strokeWidth={1.5} />
          {/* Double tick mark on left side */}
          <line x1={52} y1={y - 5} x2={52} y2={y + 5} stroke={C.neutral} strokeWidth={1.5} />
          <line x1={58} y1={y - 5} x2={58} y2={y + 5} stroke={C.neutral} strokeWidth={1.5} />
        </g>
      ))}

      {/* Left secant */}
      <line x1={L_TOP.x} y1={L_TOP.y} x2={L_BOT.x} y2={L_BOT.y}
        stroke={C.primary} strokeWidth={2} />
      {/* Right secant */}
      <line x1={R_TOP.x} y1={R_TOP.y} x2={R_BOT.x} y2={R_BOT.y}
        stroke={C.primary} strokeWidth={2} />

      {/* Intersection dots */}
      {dots.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={C.primary} />
      ))}

      {/* Segment labels */}
      <text x={labelA.x} y={labelA.y} textAnchor="middle" dominantBaseline="middle"
        fontSize={14} fontWeight="600" fill={C.primary}>a={segmentA}</text>
      <text x={labelB.x} y={labelB.y} textAnchor="middle" dominantBaseline="middle"
        fontSize={14} fontWeight="600" fill={C.primary}>b={segmentB}</text>
      <text x={labelC.x} y={labelC.y} textAnchor="middle" dominantBaseline="middle"
        fontSize={14} fontWeight="600" fill={C.primary}>c={segmentC}</text>
      <text x={labelD.x} y={labelD.y} textAnchor="middle" dominantBaseline="middle"
        fontSize={14} fontWeight="600" fill={colorD}>
        {unknownField === 'segmentD' ? 'x=?' : `d=${segmentD}`}
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
  segmentA: number;        // height of first vertical  (small triangle height)
  segmentB: number;        // extra height to second vertical top (total = A+B)
  segmentC: number;        // horizontal distance from V to first vertical
  segmentD: number | 'x';  // horizontal distance from V to second vertical
  unknownField?: string;
}

export function TalesShadowSVG({
  segmentA, segmentB, segmentC, segmentD, unknownField = 'segmentD',
}: TalesShadowSVGProps) {
  const V_X = 40, GROUND_Y = 260;

  // Estimate segmentD when unknown (similar triangles: A/C = (A+B)/D)
  const dVal = segmentD === 'x'
    ? segmentC * (segmentA + segmentB) / segmentA
    : segmentD;

  // Uniform scale: heights cap at 200px; horizontal capped to fit viewBox
  const s = Math.min(
    200 / (segmentA + segmentB),
    310 / dVal,               // 40 + 310 = 350, leaves margin for labels
  );

  const x1 = V_X + segmentC * s;
  const x2 = V_X + dVal * s;
  const y1top  = GROUND_Y - segmentA * s;
  const y2top  = GROUND_Y - (segmentA + segmentB) * s;
  const yInner = y1top; // inner horizontal at height of first vertical

  const colorD = unknownField === 'segmentD' ? C.unknown : C.primary;
  const SZ = 7; // right-angle marker size

  return (
    <svg viewBox="0 0 400 300" className="w-full max-w-md">
      {/* Ground line */}
      <line x1={V_X} y1={GROUND_Y} x2={x2 + 16} y2={GROUND_Y}
        stroke={C.neutral} strokeWidth={2} />

      {/* Hypotenuse: V → top of second vertical (passes through first top) */}
      <line x1={V_X} y1={GROUND_Y} x2={x2} y2={y2top}
        stroke={C.primary} strokeWidth={2} />

      {/* Inner horizontal: top of first vertical → second vertical at same height */}
      <line x1={x1} y1={yInner} x2={x2} y2={yInner}
        stroke={C.neutral} strokeWidth={1.5} strokeDasharray="5 3" />

      {/* First vertical (parallel line 1) */}
      <line x1={x1} y1={GROUND_Y} x2={x1} y2={y1top}
        stroke={C.primary} strokeWidth={2} />

      {/* Second vertical (parallel line 2) */}
      <line x1={x2} y1={GROUND_Y} x2={x2} y2={y2top}
        stroke={colorD} strokeWidth={2} />

      {/* Right-angle marker at base of first vertical (opens right) */}
      <path d={`M ${x1} ${GROUND_Y - SZ} L ${x1 + SZ} ${GROUND_Y - SZ} L ${x1 + SZ} ${GROUND_Y}`}
        fill="none" stroke={C.neutral} strokeWidth={1.2} />

      {/* Right-angle marker at base of second vertical (opens left) */}
      <path d={`M ${x2} ${GROUND_Y - SZ} L ${x2 - SZ} ${GROUND_Y - SZ} L ${x2 - SZ} ${GROUND_Y}`}
        fill="none" stroke={C.neutral} strokeWidth={1.2} />

      {/* Tick marks on first vertical */}
      <line x1={x1 - 6} y1={(GROUND_Y + y1top) / 2 - 5} x2={x1 + 6} y2={(GROUND_Y + y1top) / 2 - 5}
        stroke={C.neutral} strokeWidth={1.5} />
      <line x1={x1 - 6} y1={(GROUND_Y + y1top) / 2 + 5} x2={x1 + 6} y2={(GROUND_Y + y1top) / 2 + 5}
        stroke={C.neutral} strokeWidth={1.5} />

      {/* Tick marks on second vertical (on lower portion, same height band) */}
      <line x1={x2 - 6} y1={(GROUND_Y + y1top) / 2 - 5} x2={x2 + 6} y2={(GROUND_Y + y1top) / 2 - 5}
        stroke={C.neutral} strokeWidth={1.5} />
      <line x1={x2 - 6} y1={(GROUND_Y + y1top) / 2 + 5} x2={x2 + 6} y2={(GROUND_Y + y1top) / 2 + 5}
        stroke={C.neutral} strokeWidth={1.5} />

      {/* Key point dots */}
      <circle cx={V_X}  cy={GROUND_Y} r={5} fill={C.primary} />
      <circle cx={x1}   cy={GROUND_Y} r={3} fill={C.primary} />
      <circle cx={x1}   cy={y1top}    r={3} fill={C.primary} />
      <circle cx={x2}   cy={GROUND_Y} r={3} fill={colorD} />
      <circle cx={x2}   cy={y2top}    r={3} fill={colorD} />
      <circle cx={x2}   cy={yInner}   r={3} fill={C.neutral} />

      {/* segmentA label: left of first vertical, centred on its height */}
      <text x={x1 - 10} y={(GROUND_Y + y1top) / 2}
        textAnchor="end" dominantBaseline="middle"
        fontSize={13} fontWeight="600" fill={C.primary}>a={segmentA}</text>

      {/* segmentB label: left of second vertical, upper portion */}
      <text x={x2 - 10} y={(y2top + yInner) / 2}
        textAnchor="end" dominantBaseline="middle"
        fontSize={13} fontWeight="600" fill={colorD}>b={segmentB}</text>

      {/* segmentC label: below ground, between V and first vertical */}
      <text x={(V_X + x1) / 2} y={GROUND_Y + 18}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={13} fontWeight="600" fill={C.primary}>c={segmentC}</text>

      {/* segmentD label: below ground, between first and second vertical */}
      <text x={(x1 + x2) / 2} y={GROUND_Y + 18}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={13} fontWeight="600" fill={colorD}>
        {unknownField === 'segmentD' ? 'x=?' : `d=${segmentD}`}
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
// TalesDiagram — unified dispatcher
// ---------------------------------------------------------------------------

export type TalesDiagramType = 'classic' | 'shadow' | 'similar';

type TalesDiagramProps =
  | ({ type: 'classic' } & TalesClassicSVGProps)
  | ({ type: 'shadow'  } & TalesShadowSVGProps)
  | ({ type: 'similar' } & TalesSimilarSVGProps);

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
        unknownField={props.unknownField}
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
