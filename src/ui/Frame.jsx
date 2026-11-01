import { useEffect, useRef, useState } from 'react';
import './Frame.scss';

// the dotted HUD frame around the window, its corners cut, drawn at real pixel size
const Frame = () => {
    const ref = useRef(null);
    const [box, setBox] = useState({ w: 0, h: 0 });

    useEffect(() => {
        const el = ref.current;
        const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const { w, h } = box;
    const c = 18;
    const outline = `M${c} 0.5 H${w - c} L${w - 0.5} ${c} V${h - c} L${w - c} ${h - 0.5} H${c} L0.5 ${h - c} V${c} Z`;
    const corners = [
        `M0.5 ${c + 22} V${c} L${c} 0.5 H${c + 22}`,
        `M${w - c - 22} 0.5 H${w - c} L${w - 0.5} ${c} V${c + 22}`,
        `M${w - 0.5} ${h - c - 22} V${h - c} L${w - c} ${h - 0.5} H${w - c - 22}`,
        `M${c + 22} ${h - 0.5} H${c} L0.5 ${h - c} V${h - c - 22}`,
    ];

    return (
        <div className="frame" ref={ref} aria-hidden="true">
            {w > 0 && (
                <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
                    <path className="frame__dots" d={outline} />
                    {corners.map(d => <path className="frame__corner" d={d} key={d} />)}
                </svg>
            )}
        </div>
    );
};

export default Frame;
