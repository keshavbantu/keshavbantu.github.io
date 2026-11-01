// the bottom bar of a sideways popover: close on the left, "03 / 06" in the middle, prev and next on the right
import { CornerNav } from './Popover';
import './Pager.scss';

const pad = n => String(n).padStart(2, '0');

const Pager = ({ track, onClose }) => {
    return (
        <footer className="pager">
            <CornerNav onClose={onClose} />
            <p className="pager__count mono tnum" aria-live="polite">
                {pad(Math.min(track.current + 1, track.count))} <span>/ {pad(track.count)}</span>
            </p>
            <div className="pager__turn">
                <button className="chip" onClick={() => track.step(-1)} disabled={track.atStart}>Prev</button>
                <button className="chip" onClick={() => track.step(1)} disabled={track.atEnd}>Next</button>
            </div>
        </footer>
    );
};

export default Pager;
