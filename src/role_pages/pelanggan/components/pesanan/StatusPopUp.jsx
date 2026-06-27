

export default function StatusPopUp({ icon, iconBg = "bg-gray-100", title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}>
      
      <div
        className="bg-white rounded-xl w-[min(94vw,420px)] p-6 text-center shadow-[0_12px_40px_rgba(0,0,0,.25)]"
        onClick={(e) => e.stopPropagation()}>
        
        {icon != null &&
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl ${iconBg}`}>
            {icon}
          </div>
        }
        {title && <div className="text-base font-bold text-gray-900 mb-1.5">{title}</div>}
        {children}
      </div>
    </div>);

}