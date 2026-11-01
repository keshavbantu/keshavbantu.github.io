import { useEffect, useRef, useState } from 'react';

// a horizontal track you can swipe (touch scrolls natively) or drag with a mouse;
// a drag that moved doesn't count as a click on the card under it. It also reports
// which card is current (the one at the left edge, or the last once scrolled to the end)
export function useDragScroll() {
    const ref = useRef(null);
    const drag = useRef(null);
    const [current, setCurrent] = useState(0);
    const [lead, setLead] = useState(0);
    const [count, setCount] = useState(0);
    const [edges, setEdges] = useState({ start: true, end: true });

    useEffect(() => {
        const el = ref.current;
        const measure = () => {
            const cards = [...el.children];
            setCount(cards.length);
            const scrollable = el.scrollWidth > el.clientWidth + 2;
            const atEnd = !scrollable || el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
            setEdges({ start: el.scrollLeft <= 2, end: atEnd });
            const left = el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).paddingLeft);
            let best = 0;
            cards.forEach((c, i) => {
                if (Math.abs(c.getBoundingClientRect().left - left) < Math.abs(cards[best].getBoundingClientRect().left - left)) best = i;
            });
            // the counter reads the last card once the row has run out; stepping works from the first card in view
            setLead(best);
            setCurrent(scrollable && atEnd ? cards.length - 1 : best);
        };
        measure();
        el.addEventListener('scroll', measure, { passive: true });
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => {
            el.removeEventListener('scroll', measure);
            ro.disconnect();
        };
    }, []);

    const handlers = {
        onPointerDown: e => {
            if (e.pointerType !== 'mouse') return;
            drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false };
        },
        onPointerMove: e => {
            if (!drag.current) return;
            const dx = e.clientX - drag.current.x;
            if (Math.abs(dx) > 4) drag.current.moved = true;
            ref.current.scrollLeft = drag.current.left - dx;
        },
        onPointerUp: () => {
            const moved = drag.current?.moved;
            drag.current = null;
            if (moved) {
                // swallow the click that follows a drag
                const stop = ev => {
                    ev.stopPropagation();
                    ev.preventDefault();
                };
                ref.current.addEventListener('click', stop, { capture: true, once: true });
                setTimeout(() => ref.current?.removeEventListener('click', stop, { capture: true }), 0);
            }
        },
        onPointerLeave: () => (drag.current = null),
    };

    // one card at a time from the first card in view
    const step = d => {
        const el = ref.current;
        const card = el.children[Math.max(0, Math.min(el.children.length - 1, lead + d))];
        el.scrollTo({ left: card.offsetLeft - el.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft), behavior: 'smooth' });
    };

    return { ref, handlers, step, current, count, atStart: edges.start, atEnd: edges.end };
}
