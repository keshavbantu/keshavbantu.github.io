import { useEffect, useRef } from 'react';
import { reducedMotion } from '../lib/hooks';
import './Wordmark.scss';

// set in Doto, a dot-matrix face whose weight axis is the size of its dots
const BASE = 760;
const SWELL = 900; // near the cursor the dots grow
const OFF = 100; // on load every dot starts as a pinprick
const TRACK = 0.02; // em taken off each letter box
const SPACE = ' ';

/*
 * The name, fitted edge to edge: the longest line fills the width and every
 * line shares its size. Each letter is its own box; the cursor swells the
 * dots of the letters near it. On load the letters power on one after
 * another, from pinpricks to full dots.
 */
const Wordmark = ({ lines = ['BANTWAL'], decorative = true, className = '' }) => {
    const rootRef = useRef(null);
    const key = lines.join('\n');

    useEffect(() => {
        const root = rootRef.current;
        const rows = [...root.querySelectorAll('.wordmark__line')];
        const letters = [...root.querySelectorAll('.wordmark__l')];
        const still = reducedMotion();

        const weight = new Array(letters.length).fill(still ? BASE : OFF);
        const startAt = letters.map((_, i) => performance.now() + 120 + i * 55);
        let pointer = null;
        let raf = 0;

        const setWeight = (el, w) => {
            el.style.fontVariationSettings = `"wght" ${w.toFixed(1)}`;
        };
        letters.forEach((el, i) => setWeight(el, weight[i]));

        // measure each glyph on an offscreen probe so the layout never sees the 1000px text
        const probe = document.createElement('span');
        probe.className = 'wordmark__probe';
        probe.style.fontVariationSettings = `"wght" ${BASE}`;
        document.body.appendChild(probe);

        const fit = () => {
            const width = root.offsetWidth;
            if (!width) return;
            const measured = rows.map(row =>
                [...row.children].map(el => {
                    probe.textContent = el.textContent;
                    return probe.getBoundingClientRect().width / 1000 - TRACK;
                })
            );
            probe.textContent = '';
            const longest = Math.max(...measured.map(m => m.reduce((a, b) => a + b, 0)));
            const size = width / longest;
            root.style.fontSize = `${size}px`;
            rows.forEach((row, r) =>
                [...row.children].forEach((el, i) => {
                    el.style.width = `${measured[r][i] * size}px`;
                })
            );
        };

        const tick = now => {
            const radius = Math.max(root.offsetWidth * 0.32, 120);
            let moving = false;

            letters.forEach((el, i) => {
                const drawing = now < startAt[i] && !still;
                let target = drawing ? OFF : BASE;
                if (pointer && !drawing) {
                    const box = el.getBoundingClientRect();
                    const d = Math.hypot(
                        pointer.x - (box.left + box.width / 2),
                        (pointer.y - (box.top + box.height / 2)) * 1.3
                    );
                    const t = Math.max(0, 1 - d / radius);
                    target = BASE + (SWELL - BASE) * t * t * (3 - 2 * t);
                }
                const next = weight[i] + (target - weight[i]) * (drawing ? 1 : 0.13);
                if (drawing || Math.abs(next - weight[i]) > 0.3) moving = true;
                if (Math.abs(next - weight[i]) > 0.05) {
                    weight[i] = next;
                    setWeight(el, next);
                }
            });

            raf = moving ? requestAnimationFrame(tick) : 0;
        };

        const wake = () => {
            if (!raf) raf = requestAnimationFrame(tick);
        };
        const onPointer = e => {
            const p = e.touches ? e.touches[0] : e;
            pointer = { x: p.clientX, y: p.clientY };
            wake();
        };
        const onLeave = () => {
            pointer = null;
            wake();
        };

        const ro = new ResizeObserver(fit);
        ro.observe(root);
        // Doto only starts loading once something uses it, so ask for it before trusting a measurement
        document.fonts?.load(`${BASE} 100px Doto`).then(fit);
        document.fonts?.ready.then(fit);
        fit();
        wake();

        window.addEventListener('pointermove', onPointer, { passive: true });
        window.addEventListener('touchmove', onPointer, { passive: true });
        document.documentElement.addEventListener('pointerleave', onLeave);
        window.addEventListener('touchend', onLeave);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            probe.remove();
            window.removeEventListener('pointermove', onPointer);
            window.removeEventListener('touchmove', onPointer);
            document.documentElement.removeEventListener('pointerleave', onLeave);
            window.removeEventListener('touchend', onLeave);
        };
    }, [key]);

    return (
        <div className={`wordmark ${className}`} ref={rootRef} aria-hidden={decorative || undefined}>
            {lines.map(line => (
                <span className="wordmark__line" key={line}>
                    {[...line].map((ch, i) => (
                        <span className="wordmark__l" key={i}>{ch === ' ' ? SPACE : ch}</span>
                    ))}
                </span>
            ))}
        </div>
    );
};

export default Wordmark;
