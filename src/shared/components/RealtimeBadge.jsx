
import { useEffect, useState } from "react";
import { fmtTime } from "../utils/format";

export default function RealtimeBadge({ lastUpdated, loading }) {
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    if (!lastUpdated) return;
    const update = () => {
      const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      if (diff < 5) setTimeStr("baru saja");else
      if (diff < 60) setTimeStr(`${diff} dtk lalu`);else
      setTimeStr(fmtTime(lastUpdated.toISOString()));
    };
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <span
        className={[
        "w-[7px] h-[7px] rounded-full flex-shrink-0 inline-block",
        loading ? "bg-amber-400" : "bg-green-500 animate-[rt-pulse_2s_infinite]"].
        join(" ")} />
      
      <span>{loading ? "Memperbarui…" : timeStr ? `Diperbarui ${timeStr}` : "Live"}</span>
    </div>);

}