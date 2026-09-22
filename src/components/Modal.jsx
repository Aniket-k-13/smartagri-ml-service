export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-card-header">
          <h2>{title}</h2>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
