





















export default function SortableTh({ label, sortKey, sortDir, colKey, onSort, type = "string", enumMap = null }) {
  const active = sortKey === colKey;
  return (
    <th
      onClick={() => onSort(colKey, type, enumMap)}
      className="cursor-pointer select-none whitespace-nowrap">
      
      <span className="inline-flex items-center gap-[3px]">
        {label}
        <span className={`text-[.65rem] leading-none inline-flex flex-col ${active ? "text-gray-700" : "text-gray-300"}`}>
          <span style={{ opacity: active && sortDir === "asc" ? 1 : 0.35 }}>▲</span>
          <span style={{ opacity: active && sortDir === "desc" ? 1 : 0.35 }}>▼</span>
        </span>
      </span>
    </th>);

}