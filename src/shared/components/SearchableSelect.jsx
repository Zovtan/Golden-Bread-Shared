
import { useState, useRef, useEffect, useCallback } from "react";












export default function SearchableSelect({
  options = [], value, onChange, placeholder = "Pilih...",
  semua, disabled = false, error
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value)) ?? null;

  useEffect(() => {
    if (!open) return;
    const fn = (e) => {if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);};
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);


  useEffect(() => {if (open) {setQuery("");inputRef.current?.focus();}}, [open]);

  const filtered = query.trim() ?
  options.filter((o) =>
  o.label.toLowerCase().includes(query.toLowerCase()) ||
  (o.sub ?? "").toLowerCase().includes(query.toLowerCase())) :
  options;

  const handleSelect = useCallback((val) => {
    onChange(val);setOpen(false);setQuery("");
  }, [onChange]);

  const toggle = () => {
    if (disabled) return;
    if (!open && wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const dropHeight = 280;
      const flipUp = spaceBelow < dropHeight && r.top > dropHeight;
      setDropPos({
        top: flipUp ? "auto" : r.bottom + 4,
        bottom: flipUp ? window.innerHeight - r.top + 4 : "auto",
        left: r.left, width: r.width, flipUp
      });
    }
    setOpen((v) => !v);
  };

  const triggerBorder = error ? "#f87171" : open ? "#6366f1" : "#d1d5db";
  const triggerShadow = open ? "0 0 0 3px rgba(99,102,241,.12)" : "none";

  return (
    <div ref={wrapRef} className="relative">
      {}
      <div
        onClick={toggle}
        className={[
        "flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm min-h-[36px]",
        "select-none transition-[border-color,box-shadow] duration-150",
        disabled ? "cursor-not-allowed bg-gray-50" : "cursor-pointer bg-white",
        selected ? "text-gray-900" : "text-gray-400"].
        join(" ")}
        style={{ border: `1px solid ${triggerBorder}`, boxShadow: triggerShadow }}>
        
        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {selected ? selected.label : placeholder}
        </span>
        <span className="ml-1.5 text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </div>

      {}
      {open &&
      <div
        className="fixed z-[9999] bg-white border border-gray-200 rounded-lg overflow-hidden"
        style={{
          top: dropPos.flipUp ? "auto" : dropPos.top,
          bottom: dropPos.flipUp ? dropPos.bottom : "auto",
          left: dropPos.left,
          width: dropPos.width,
          boxShadow: "0 8px 24px rgba(0,0,0,.12)"
        }}>
        
          {}
          <div className="p-2 pb-1">
            <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari..."
            className="w-full box-border px-2 py-1 border border-gray-300 rounded
                         text-[.8125rem] outline-none"


            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter" && filtered.length === 1) handleSelect(String(filtered[0].value));
            }} />
          
          </div>

          {}
          <div className="max-h-[220px] overflow-y-auto">
            {semua &&
          <div
            onClick={() => {onChange("");setOpen(false);setQuery("");}}
            className={[
            "px-3 py-[7px] cursor-pointer text-sm border-b border-gray-100",
            !value ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"].
            join(" ")}>
            
                {semua}
              </div>
          }
            {filtered.length === 0 ?
          <div className="px-3 py-2.5 text-[.8125rem] text-gray-400">Tidak ditemukan</div> :
          filtered.map((o) => {
            const isActive = String(o.value) === String(value);
            return (
              <div
                key={o.value}
                onClick={() => handleSelect(String(o.value))}
                className={[
                "px-3 py-[7px] cursor-pointer text-sm flex flex-col",
                isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-900 hover:bg-gray-50"].
                join(" ")}>
                
                  <span>{o.label}</span>
                  {o.sub && <span className="text-xs text-gray-500 mt-px">{o.sub}</span>}
                </div>);

          })}
          </div>
        </div>
      }
    </div>);

}