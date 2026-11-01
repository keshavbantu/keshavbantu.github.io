import { useEffect, useRef } from 'react';
import { reducedMotion } from '../lib/hooks';
import './Scene.scss';

// three.js loads after the page has painted, then fades in behind it
const Scene = ({ entries, active, paused }) => {
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        import('./river').then(({ createRiver }) => {
            if (cancelled || !canvasRef.current) return;
            try {
                sceneRef.current = createRiver(canvasRef.current, { entries, still: reducedMotion() });
                canvasRef.current.classList.add('is-ready');
            } catch {
                // no WebGL: the page stands on its own without the river
            }
        });
        return () => {
            cancelled = true;
            sceneRef.current?.dispose();
            sceneRef.current = null;
        };
    }, [entries]);

    useEffect(() => {
        sceneRef.current?.setActive(active);
    }, [active]);

    useEffect(() => {
        sceneRef.current?.setPaused(paused, true);
    }, [paused]);

    return <canvas className="scene" ref={canvasRef} aria-hidden="true" />;
};

export default Scene;
