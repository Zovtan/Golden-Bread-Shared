import { useState, useEffect } from "react";
import SearchBar from "../../../shared/components/SearchBar";
import { todayWIB } from "../../../shared/utils/format";
import { useSortableTable, ENUM_MAPS } from "../../../shared/hooks/useSortableTable";
import SortableTh from "../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../shared/components/Pagination";
import { useLogAktivitas,
AKTIVITAS_OPTS,
MODUL_OPTS,
MODUL_LABEL } from
"../hooks/useLogAktivitas";

const AKTIVITAS_CLS = {
  LOGIN: "badge-status aktif",
  LOGOUT: "badge-status normal",
  LOGIN_FAILED: "badge-status habis",
  CREATE: "badge-status selesai",
  UPDATE: "badge-status menipis",
  DELETE: "badge-status habis"
};

export function LogSearchBar({ value, onChange }) {
  return (
    <SearchBar value={value} onChange={onChange} placeholder="Cari user, detail, modul..." />);

}


export default function LogAktivitasPage({ search: headerSearch = "" }) {
  const { rows, loading, error, fetch, ROLE_OPTS } = useLogAktivitas();
  const { sorted: logListSorted, sortKey, sortDir, toggleSort } = useSortableTable(rows);
  const { paged: logListSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(logListSorted, 20);

  const [tanggal, setTanggal] = useState(todayWIB);
  const [role, setRole] = useState("Semua Role");
  const [aktivitas, setAktivitas] = useState("Semua Aktivitas");
  const [modul, setModul] = useState("Semua Modul");
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState({ tanggal: todayWIB() });

  useEffect(() => {fetch({ tanggal: todayWIB() });}, []);

  useEffect(() => {
    if (headerSearch === search) return;

    setSearch(headerSearch);
    fetch({ ...applied, search: headerSearch });
  }, [headerSearch]);

  const handleReset = () => {
    setTanggal("");setRole("Semua Role");setAktivitas("Semua Aktivitas");
    setModul("Semua Modul");setSearch("");setApplied({});
    fetch({});
  };

  const handleFilter = () => {
    const params = {
      tanggal,
      role: role === "Semua Role" ? "" : role,
      aktivitas: aktivitas === "Semua Aktivitas" ? "" : aktivitas,
      modul: modul === "Semua Modul" ? "" : modul
    };
    setApplied(params);
    fetch(params);
  };

  return (
    <div>
      <div className="db-card">
        <div className="laporan-filter">
          <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".75rem" }}>
            Filter Log Aktivitas:
          </div>
          <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", alignItems: "flex-end" }}>

            <div className="form-field" style={{ margin: 0, minWidth: 150 }}>
              <label>Tanggal</label>
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>

            <div className="form-field" style={{ margin: 0, minWidth: 150 }}>
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLE_OPTS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div className="form-field" style={{ margin: 0, minWidth: 170 }}>
              <label>Aktivitas</label>
              <select value={aktivitas} onChange={(e) => setAktivitas(e.target.value)}>
                {AKTIVITAS_OPTS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>

            <div className="form-field" style={{ margin: 0, minWidth: 180 }}>
              <label>Modul</label>
              <select value={modul} onChange={(e) => setModul(e.target.value)}>
                {MODUL_OPTS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>

            <button
              className="btn-primary"
              style={{ borderRadius: 6, alignSelf: "flex-end", height: 38, padding: "0 1.25rem" }}
              onClick={handleFilter} disabled={loading}>
              
              {loading ? "..." : "Filter"}
            </button>
            <button
              className="btn-secondary"
              style={{ borderRadius: 6, alignSelf: "flex-end", height: 38, padding: "0 1.25rem" }}
              onClick={handleReset} disabled={loading}>
              
              Reset
            </button>
          </div>
        </div>

        {error && <p className="db-fetch-error">{error}</p>}
        {loading && <p className="db-loading-text">Memuat log...</p>}

        <div style={{ overflowX: "auto" }}>
          <div className="db-table-wrap"><div className="db-table-wrap"><table className="db-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>

                <SortableTh label="Timestamp" colKey="timestamp_raw" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

                <SortableTh label="User" colKey="user" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

                <SortableTh label="Role" colKey="role" type="enum" enumMap={ENUM_MAPS.role} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

                <SortableTh label="Aktivitas" colKey="aktivitas" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

                <SortableTh label="Modul" colKey="modul" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

                <th>Detail</th>

              </tr>
            </thead>
            <tbody>
              {logListSortedPaged.length === 0 && !loading &&
                  <tr>
                  <td colSpan={6} style={{ color: "#6b7280", textAlign: "center", padding: "1.5rem" }}>
                    Tidak ada log.
                  </td>
                </tr>
                  }
              {logListSortedPaged.map((r) =>
                  <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", fontSize: ".8125rem" }}>
                    {r.timestamp}
                  </td>
                  <td style={{ fontWeight: r.user === "Unknown" ? 400 : 500 }}>
                    {r.user}
                  </td>
                  <td>{r.role}</td>
                  <td>
                    <span className={`db-badge ${AKTIVITAS_CLS[r.aktivitas] ?? "badge-status normal"}`}>
                      {r.aktivitas}
                    </span>
                  </td>
                  <td>{MODUL_LABEL[r.modul] ?? r.modul}</td>
                  <td style={{ maxWidth: 340, wordBreak: "break-word", fontSize: ".8125rem" }}>
                    {r.detail}
                  </td>
                </tr>
                  )}
            </tbody>
          </table>
      <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
</div>
</div>
        </div>
      </div>
    </div>);

}