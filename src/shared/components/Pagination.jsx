






const WINDOW = 5;

const Ellipsis = () =>
<span className="px-0.5 self-center text-xs text-gray-400">…</span>;


export default function Pagination({ page, totalPages, onPageChange, className = "", variant = "default" }) {
  if (totalPages <= 1) return null;

  const half = Math.floor(WINDOW / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(totalPages, start + WINDOW - 1);
  if (end - start < WINDOW - 1) start = Math.max(1, end - WINDOW + 1);

  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className={`db-pagination${className ? " " + className : ""}${variant === "amber" ? " pagination-amber" : ""}`}>
      <button className="db-page-btn" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
        ‹ Prev
      </button>

      {start > 1 &&
      <>
          <button className="db-page-btn" onClick={() => onPageChange(1)}>1</button>
          {start > 2 && <Ellipsis />}
        </>
      }

      {pages.map((n) =>
      <button
        key={n}
        className={`db-page-btn${page === n ? " active" : ""}`}
        onClick={() => onPageChange(n)}>
        
          {n}
        </button>
      )}

      {end < totalPages &&
      <>
          {end < totalPages - 1 && <Ellipsis />}
          <button className="db-page-btn" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
        </>
      }

      <button className="db-page-btn" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
        Next ›
      </button>
    </div>);

}