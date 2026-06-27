
import { useState, useEffect, useRef } from "react";



export default function QtyInput({ value, max, onChange, className = "", style, step = 1, min = step }) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const [showWarn, setShowWarn] = useState(false);
  const internalChangeRef = useRef(false);

  useEffect(() => {

    if (!internalChangeRef.current) setDraft(String(value));
    internalChangeRef.current = false;
  }, [value]);

  useEffect(() => {
    if (!showWarn) return;
    const t = setTimeout(() => setShowWarn(false), 2000);
    return () => clearTimeout(t);
  }, [showWarn]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setDraft(raw);
    const n = Number(raw);
    if (raw === "" || isNaN(n) || n <= 0) return;
    internalChangeRef.current = true;
    if (max !== undefined && n > max) {setShowWarn(true);onChange(max);setDraft(String(max));} else
    onChange(n);
  };

  const handleBlur = () => {
    setFocused(false);
    const n = Number(draft);
    if (!draft || isNaN(n) || n <= 0) {setDraft(String(value));return;}
    if (max !== undefined && n > max) {
      setShowWarn(true);internalChangeRef.current = true;
      onChange(max);setDraft(String(max));
    } else {
      internalChangeRef.current = true;onChange(n);
    }
  };

  return (
    <div className="relative inline-flex">
      <input
        type="number" min={min} step={step} max={max}
        value={focused ? draft : String(value)}
        onFocus={() => {setFocused(true);setDraft(String(value));}}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`qty-input ${className}`}
        style={style} />
      
      {showWarn && max !== undefined &&
      <div className="qty-warn">
          Maks. stok: {max}
          <span className="qty-warn-arrow" />
        </div>
      }
    </div>);

}