
import { useEffect } from "react";


export default function Modal({ open, onClose, title, children, maxWidth = "520px", footer }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {if (e.key === "Escape") onClose();};
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {document.body.style.overflow = "";};
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      {}
      <div className="modal-box flex flex-col" style={{ maxWidth, maxHeight: "90vh" }}>
        <h2 className="modal-title flex-shrink-0">{title}</h2>
        <div className="modal-body overflow-y-auto flex-1">{children}</div>
        {footer && <div className="modal-footer flex-shrink-0">{footer}</div>}
      </div>
    </div>);

}