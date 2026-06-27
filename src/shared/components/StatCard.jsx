
export default function StatCard({ value, label }) {
  return (
    <div className="db-stat">
      <div className="db-stat-value">{value}</div>
      <div className="db-stat-label">{label}</div>
    </div>);

}