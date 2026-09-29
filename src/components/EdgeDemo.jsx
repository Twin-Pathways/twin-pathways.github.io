import { useCallback, useEffect, useRef, useState } from 'react';
import { demoEdges } from '../data.js';
import { usePrefersReducedMotion } from '../hooks.js';

// Geometry of the two strands between gene A (left) and gene B (right).
const NODE_W = 116;
const NODE_H = 56;
const A_X = 12;
const B_X = 560 - 12 - NODE_W;
const CY = 120;
const TOP = { x1: A_X + NODE_W, y1: CY - 12, cx: 280, cy: 8, x2: B_X, y2: CY - 12 };
const BOTTOM = { x1: B_X, y1: CY + 12, cx: 280, cy: 232, x2: A_X + NODE_W, y2: CY + 12 };

const strand = (s) => `M${s.x1} ${s.y1} Q${s.cx} ${s.cy} ${s.x2} ${s.y2}`;
const headAngle = (s) => (Math.atan2(s.y2 - s.cy, s.x2 - s.cx) * 180) / Math.PI;

const GLYPH = { ab: '→', ba: '←', both: '⇄', none: '–' };
const READ_MS = 950;

function verdictText(edge) {
  if (edge.result === 'ab') return `${edge.a} → ${edge.b}`;
  if (edge.result === 'ba') return `${edge.b} → ${edge.a}`;
  return `${edge.a} ⇄ ${edge.b}`;
}

export default function EdgeDemo() {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState(reduced ? 'done' : 'idle');
  const [seen, setSeen] = useState(reduced ? 3 : 0);
  const timers = useRef([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const run = useCallback(
    (i) => {
      clear();
      setIndex(i);
      if (reduced) {
        setPhase('done');
        setSeen(3);
        return;
      }
      setPhase('idle');
      setSeen(0);
      const at = (ms, fn) => timers.current.push(setTimeout(fn, ms));
      at(500, () => setPhase('reading'));
      for (let k = 1; k <= 3; k++) at(500 + k * READ_MS, () => setSeen(k));
      at(500 + 3 * READ_MS + 500, () => setPhase('done'));
    },
    [reduced]
  );

  useEffect(() => {
    run(0);
    return clear;
  }, [run]);

  const edge = demoEdges[index];
  const done = phase === 'done';
  const abOn = edge.result === 'ab' || edge.result === 'both';
  const baOn = edge.result === 'ba' || edge.result === 'both';
  const strandClass = (on) => (done ? (on ? 'is-on' : 'is-off') : 'is-open');

  return (
    <div className="demo" role="group" aria-label="Example: how Genie5 gives an edge a direction">
      <div className="demo__tabs">
        {demoEdges.map((e, i) => (
          <button
            key={e.a + e.b}
            type="button"
            className="demo__tab"
            aria-pressed={i === index}
            onClick={() => run(i)}
          >
            {e.a} – {e.b}
          </button>
        ))}
      </div>

      <svg className="demo__graph" viewBox="0 0 560 240" aria-hidden="true">
        <path className={`strand strand--ab ${strandClass(abOn)}`} d={strand(TOP)} />
        <path className={`strand strand--ba ${strandClass(baOn)}`} d={strand(BOTTOM)} />
        <g
          className={`head head--ab ${done && abOn ? 'is-on' : ''}`}
          transform={`translate(${TOP.x2} ${TOP.y2}) rotate(${headAngle(TOP)})`}
        >
          <path d="M0 0 L-17 -8 L-17 8 Z" />
        </g>
        <g
          className={`head head--ba ${done && baOn ? 'is-on' : ''}`}
          transform={`translate(${BOTTOM.x2} ${BOTTOM.y2}) rotate(${headAngle(BOTTOM)})`}
        >
          <path d="M0 0 L-17 -8 L-17 8 Z" />
        </g>

        {[
          { x: A_X, label: edge.a },
          { x: B_X, label: edge.b },
        ].map((n) => (
          <g key={n.x}>
            <rect className="node" x={n.x} y={CY - NODE_H / 2} width={NODE_W} height={NODE_H} rx="4" />
            <text className="node__label" x={n.x + NODE_W / 2} y={CY + 6} textAnchor="middle">
              {n.label}
            </text>
          </g>
        ))}
      </svg>

      <ol className="evidence">
        {edge.evidence.map((ev, k) => {
          const state = k < seen ? 'read' : k === seen && phase === 'reading' ? 'reading' : 'waiting';
          return (
            <li key={ev.source} className={`evidence__row evidence__row--${state}`}>
              <span className="evidence__source">{ev.source}</span>
              <span className="evidence__text">{ev.text}</span>
              <span className={`evidence__vote evidence__vote--${state === 'read' ? ev.vote : 'wait'}`}>
                {state === 'read' ? GLYPH[ev.vote] : '·'}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="verdict" aria-live="polite">
        {done ? (
          <p className={`verdict__edge verdict__edge--${edge.result}`}>{verdictText(edge)}</p>
        ) : (
          <p className="verdict__wait">
            {phase === 'idle' ? 'Undirected edge' : `Reading evidence, ${seen}/3`}
          </p>
        )}
      </div>

      <p className="demo__note">
        Illustrative example. The evidence lines summarize well-known relationships and are not output from a real run.
      </p>
    </div>
  );
}
