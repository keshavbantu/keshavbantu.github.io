import { useEffect, useRef } from 'react';
import './Popover.scss';

// a modal panel that opens like a screen powering on. A click outside closes it;
// Esc steps back one layer, which is the same thing unless onEscape says otherwise
const Popover = ({ label, onClose, onEscape = onClose, className = '', children }) => {
    const ref = useRef(null);
    const escape = useRef(onEscape);
    escape.current = onEscape;

    useEffect(() => {
        const dialog = ref.current;
        dialog.showModal();
        dialog.querySelector('.popover__panel').focus();
        const onCancel = e => {
            e.preventDefault();
            escape.current();
        };
        dialog.addEventListener('cancel', onCancel);
        return () => dialog.removeEventListener('cancel', onCancel);
    }, []);

    const onClick = e => {
        if (e.target === ref.current) onClose();
    };

    return (
        <dialog className={`popover ${className}`} ref={ref} aria-label={label} onClick={onClick}>
            <div className="popover__panel" tabIndex={-1}>
                {children}
            </div>
        </dialog>
    );
};

// back and close, kept together in each popover's bottom-left corner where a thumb reaches;
// a popover one step from home has nowhere to go back to but home, so it shows close alone
export const CornerNav = ({ onBack, onClose, backLabel = 'Back' }) => (
    <div className="corner-nav">
        {onBack && (
            <button className="corner-nav__btn" onClick={onBack} aria-label={backLabel} title={`${backLabel} (esc)`}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H3.5M7.5 3.5 3 8l4.5 4.5" /></svg>
            </button>
        )}
        <button className="corner-nav__btn" onClick={onClose} aria-label="Close" title={onBack ? 'Close' : 'Close (esc)'}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg>
        </button>
    </div>
);

export default Popover;
