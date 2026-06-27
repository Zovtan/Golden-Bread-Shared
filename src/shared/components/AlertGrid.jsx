








export default function AlertGrid({ items = [], onItemClick }) {
  if (!items.length) {
    return <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Tidak ada alert.</p>;
  }
  return (
    <div className="db-alerts">
      {items.map((item) => {
        const clickable = Boolean(onItemClick && item.navKey);
        return (
          <div
            key={item.id}
            className={`db-alert-item ${item.variant}${clickable ? " clickable" : ""}`}
            onClick={clickable ? () => onItemClick(item) : undefined}
            style={clickable ? { cursor: "pointer" } : undefined}
            title={clickable ? "Klik untuk melihat detail" : undefined}>
            
            <div className="db-alert-title">{item.title}</div>
            <div className="db-alert-sub">{item.sub}</div>
          </div>);

      })}
    </div>);

}