import React from 'react';

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {title && <h1 className="modal-title">{title}</h1>}
        <div className="modal-content">
          {children}
        </div>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          &#10005;
        </button>
      </div>
    </div>
  );
};

export default Modal; 