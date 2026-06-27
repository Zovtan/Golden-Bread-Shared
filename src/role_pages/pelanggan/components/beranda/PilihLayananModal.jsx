
export default function PilihLayananModal({ open, onClose, onSelect }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="pilih-layanan-box" onClick={(e) => e.stopPropagation()}>
        <div className="pilih-layanan-title">Pilih Layanan</div>
        <div className="pilih-layanan-options">
          {}
          <button className="pilih-layanan-opt" onClick={() => onSelect("segera")}>
            <span className="pilih-layanan-icon">🛵</span>
            <div className="pilih-layanan-label">Segera Antar</div>
            <div className="pilih-layanan-desc">Pesan hari ini, antar langsung</div>
          </button>
          {}
          <button className="pilih-layanan-opt" onClick={() => onSelect("preorder")}>
            <span className="pilih-layanan-icon">📋</span>
            <div className="pilih-layanan-label">Pre-Order</div>
            <div className="pilih-layanan-desc">Pesan dalam jumlah banyak. Khusus untuk akun <strong>Prioritas</strong></div>
          </button>
        </div>
      </div>
    </div>);

}