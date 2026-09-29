import { useEffect, useMemo, useRef, useState } from 'react';
import { networkNodes, networkEdges } from '../data.js';
import { usePrefersReducedMotion } from '../hooks.js';

// Fixed 3D layout: TP53 at the centre, its neighbours spread on a sphere, CDK2 pushed out behind CDKN1A.
function layout() {
  const ring = ['MDM2', 'ATM', 'CHEK2', 'CDKN1A', 'BAX', 'BBC3', 'GADD45A'];
  const at = { TP53: { x: 0, y: 0, z: 0 } };
  ring.forEach((name, i) => {
    const y = 1 - (2 * (i + 0.5)) / ring.length;
    const r = Math.sqrt(1 - y * y);
    const t = i * 2.399963;
    at[name] = { x: Math.cos(t) * r * 1.6, y, z: Math.sin(t) * r };
  });
  at.CDK2 = { x: at.CDKN1A.x * 1.8, y: at.CDKN1A.y * 1.8, z: at.CDKN1A.z * 1.8 };
  const max = 1.7;
  return networkNodes.map((n) => ({ x: at[n].x / max, y: at[n].y / max, z: at[n].z / max }));
}

const DEG = {};
networkEdges.forEach((e) => {
  DEG[e.from] = (DEG[e.from] || 0) + 1;
  DEG[e.to] = (DEG[e.to] || 0) + 1;
});

function describe(gene) {
  const out = networkEdges.filter((e) => e.from === gene);
  const inn = networkEdges.filter((e) => e.to === gene);
  const list = (arr, pick) => arr.map((e) => `${pick(e)} (${e.kind})`).join(', ');
  return {
    out: out.length ? list(out, (e) => e.to) : 'none in this example',
    inn: inn.length ? list(inn, (e) => e.from) : 'none in this example',
  };
}

export default function GeneNetwork3D() {
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef(null);
  const base = useMemo(layout, []);
  const [selected, setSelected] = useState(null);
  const state = useRef({ yaw: 0.6, pitch: -0.25, vyaw: 0, vpitch: 0, drag: null, hover: null, selected: null, visible: true });
  const drawRef = useRef(() => {});

  useEffect(() => {
    state.current.selected = selected;
    drawRef.current();
  }, [selected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const st = state.current;
    const css = getComputedStyle(document.documentElement);
    const col = (n) => css.getPropertyValue(n).trim();
    const C = { ink: col('--ink'), ab: col('--ab'), ba: col('--ba'), muted: col('--muted'), paper: col('--paper') };
    let w = 0, h = 0, raf = 0, projected = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const project = () => {
      const cy = Math.cos(st.yaw), sy = Math.sin(st.yaw);
      const cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
      const R = Math.min(h * 0.5, w * 0.44);
      projected = base.map((p, i) => {
        const x1 = p.x * cy + p.z * sy;
        const z1 = -p.x * sy + p.z * cy;
        const y2 = p.y * cp - z1 * sp;
        const z2 = p.y * sp + z1 * cp;
        const s = 3.2 / (3.2 - z2);
        const name = networkNodes[i];
        return { name, x: w / 2 + x1 * s * R, y: h / 2 + y2 * s * R, z: z2, s, r: (6 + (DEG[name] || 0) * 1.1) * s };
      });
    };

    const shade = (z) => 0.4 + 0.6 * Math.max(0, Math.min(1, (z + 1) / 2));

    function draw() {
      if (!w) return;
      project();
      ctx.clearRect(0, 0, w, h);
      const focus = st.hover ?? st.selected;
      const by = Object.fromEntries(projected.map((p) => [p.name, p]));
      const near = new Set();
      if (focus) {
        near.add(focus);
        networkEdges.forEach((e) => {
          if (e.from === focus) near.add(e.to);
          if (e.to === focus) near.add(e.from);
        });
      }

      networkEdges.forEach((e) => {
        const a = by[e.from], b = by[e.to];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
        const ux = dx / d, uy = dy / d;
        const x1 = a.x + ux * a.r, y1 = a.y + uy * a.r;
        const x2 = b.x - ux * (b.r + 2), y2 = b.y - uy * (b.r + 2);
        let color = C.muted, alpha = 0.55 * shade((a.z + b.z) / 2);
        if (focus) {
          if (e.from === focus) { color = C.ab; alpha = 1; }
          else if (e.to === focus) { color = C.ba; alpha = 1; }
          else alpha = 0.08;
        }
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = focus && alpha === 1 ? 2.2 : 1.4;
        ctx.setLineDash(e.kind === 'represses' ? [6, 4] : []);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
        const hs = 9 * ((a.s + b.s) / 2), ang = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - hs * Math.cos(ang - 0.4), y2 - hs * Math.sin(ang - 0.4));
        ctx.lineTo(x2 - hs * Math.cos(ang + 0.4), y2 - hs * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fill();
      });

      [...projected].sort((p, q) => p.z - q.z).forEach((p) => {
        const dim = focus && !near.has(p.name);
        ctx.globalAlpha = dim ? 0.2 : shade(p.z) + 0.1;
        ctx.fillStyle = p.name === focus ? C.ink : C.paper;
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = C.ink;
        ctx.font = `500 ${Math.round(11 + p.s * 1.5)}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(p.name, p.x, p.y - p.r - 7);
      });
      ctx.globalAlpha = 1;
    }
    drawRef.current = draw;

    const tick = () => {
      if (st.visible) {
        if (!st.drag) {
          st.yaw += st.vyaw;
          st.pitch = Math.max(-1.2, Math.min(1.2, st.pitch + st.vpitch));
          st.vyaw *= 0.94;
          st.vpitch *= 0.94;
          if (st.hover == null && !reduced) st.yaw += 0.0025;
        }
        draw();
      }
      raf = requestAnimationFrame(tick);
    };

    const pick = (px, py) => {
      let best = null, bd = 1e9;
      projected.forEach((p) => {
        const d = Math.hypot(p.x - px, p.y - py);
        if (d < p.r + 9 && d < bd) { best = p.name; bd = d; }
      });
      return best;
    };
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e) => {
      canvas.setPointerCapture(e.pointerId);
      const { x, y } = pos(e);
      st.drag = { x, y, moved: 0 };
      canvas.style.cursor = 'grabbing';
    };
    const onMove = (e) => {
      const { x, y } = pos(e);
      if (st.drag) {
        const dx = x - st.drag.x, dy = y - st.drag.y;
        st.drag.moved += Math.abs(dx) + Math.abs(dy);
        st.drag.x = x; st.drag.y = y;
        st.yaw += dx * 0.008;
        st.pitch = Math.max(-1.2, Math.min(1.2, st.pitch + dy * 0.008));
        st.vyaw = dx * 0.002;
        st.vpitch = dy * 0.002;
      } else {
        const hit = pick(x, y);
        if (hit !== st.hover) st.hover = hit;
        canvas.style.cursor = hit ? 'pointer' : 'grab';
      }
      if (reduced) draw();
    };
    const onUp = (e) => {
      const d = st.drag;
      st.drag = null;
      canvas.style.cursor = 'grab';
      if (d && d.moved < 6) {
        const { x, y } = pos(e);
        const hit = pick(x, y);
        setSelected((cur) => (hit === cur ? null : hit));
      }
      if (reduced) draw();
    };
    const onLeave = () => { st.hover = null; if (reduced) draw(); };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', resize);
    const io = new IntersectionObserver(([en]) => { st.visible = en.isIntersecting; });
    io.observe(canvas);

    resize();
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [base, reduced]);

  const info = selected ? describe(selected) : null;

  return (
    <figure className="net">
      <canvas ref={canvasRef} className="net__canvas" aria-label="Interactive 3D gene regulation network. Use the gene buttons below to explore it with a keyboard." />
      <div className="net__genes" role="group" aria-label="Genes">
        {networkNodes.map((g) => (
          <button key={g} type="button" className="demo__tab" aria-pressed={selected === g} onClick={() => setSelected((c) => (c === g ? null : g))}>
            {g}
          </button>
        ))}
      </div>
      <div className="net__info" aria-live="polite">
        {info ? (
          <>
            <p><span className="net__key net__key--out">{selected} regulates</span> {info.out}</p>
            <p><span className="net__key net__key--in">Regulated by</span> {info.inn}</p>
          </>
        ) : (
          <p>Drag to rotate. Click a gene to see what it regulates and what regulates it.</p>
        )}
      </div>
      <figcaption>
        Illustrative network around TP53, built from well-known interactions. Solid lines activate, dashed lines repress.
      </figcaption>
    </figure>
  );
}
