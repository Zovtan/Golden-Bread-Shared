import { useState } from "react";
import SearchBar from "../../../shared/components/SearchBar";
import { useUserManajemen } from "../hooks/useUserManajemen";
import TambahUserModal from "../components/user/TambahUserModal";
import EditUserModal from "../components/user/EditUserModal";
import DetailUserModal from "../components/user/DetailUserModal";
import { useSortableTable, ENUM_MAPS } from "../../../shared/hooks/useSortableTable";
import SortableTh from "../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../shared/components/Pagination";
import { AKUN_BADGE, ROLE_BADGE } from "../../../shared/utils/badgeMaps";





export default function UserPage({ search = "" }) {
  const {
    userList, stats, loading, error, lastUpdated,
    roleList, statusList,
    tambahUser, editUser
  } = useUserManajemen(search);

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const openModal = (name, u = null) => {setSelected(u);setModal(name);};
  const closeModal = () => {setModal(null);setSelected(null);};

  const { sorted: userListSorted, sortKey, sortDir, toggleSort } = useSortableTable(userList);
  const { paged: userListSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(userListSorted, 20);

  return (
    <div>
      {}
      <div className="produk-toolbar">
        <span className="produk-stat-pill">
          Total User: {stats.total}
        </span>
        <span className="produk-stat-pill">
          Aktif: {stats.aktif}
        </span>
        <span className={`produk-stat-pill${stats.tidakAktif > 0 ? " habis" : ""}`}>
          Tidak Aktif: {stats.tidakAktif}
        </span>

        <div style={{ flex: 1 }}></div>

        <button className="btn-primary" onClick={() => openModal("tambah")}>
          Tambah User Baru
        </button>
      </div>

      {}
      {error && <p className="db-fetch-error">{error}</p>}
      {loading && !lastUpdated && <p className="db-loading-text">Memuat…</p>}

      {}
      <div className="produk-table-wrap db-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="db-table-wrap"><table className="produk-table">
          <thead>
            <tr>

              <SortableTh label="ID User" colKey="id" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Nama Lengkap" colKey="nama_lengkap" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="No. Telepon" colKey="no_telp" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Email" colKey="email" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Role" colKey="role" type="enum" enumMap={ENUM_MAPS.role} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Status" colKey="status" type="enum" enumMap={ENUM_MAPS.status_akun} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Terakhir Login" colKey="last_sign_in_at" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <th>Aksi</th>

            </tr>
          </thead>
          <tbody>
            {userListSortedPaged.length === 0 && !loading &&
              <tr>
                <td colSpan={8} style={{ color: "#6b7280", textAlign: "center", padding: "1.5rem" }}>
                  Tidak ada user.
                </td>
              </tr>
              }
            {userListSortedPaged.map((u) =>
              <tr key={u.id}>
                <td style={{ fontFamily: "monospace", fontSize: ".8125rem", color: "#6b7280" }}>{u.displayId}</td>
                <td style={{ fontWeight: 500 }}>{u.nama_lengkap}</td>
                <td>{u.no_telp || "-"}</td>
                <td style={{ color: "#374151" }}>{u.email || "-"}</td>
                <td>
                  <span className={ROLE_BADGE[u.role] ?? "badge-status normal"}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <span className={AKUN_BADGE[u.status] ?? ""}>
                    {u.statusLabel}
                  </span>
                </td>
                <td style={{ color: "#6b7280", fontSize: ".8125rem" }}>{u.lastLogin}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="db-action-link" style={{ marginRight: 6 }} onClick={() => openModal("edit", u)}>Edit</button>
                  <span style={{ color: "#d1d5db" }}>/</span>
                  <button className="db-action-link" style={{ marginLeft: 6 }} onClick={() => openModal("detail", u)}>Detail</button>
                </td>
              </tr>
              )}
          </tbody>
        </table>
</div>
      <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
      </div>

      {}
      <TambahUserModal
        open={modal === "tambah"}
        onClose={closeModal}
        roleList={roleList}
        onSubmit={tambahUser} />
      

      <EditUserModal
        open={modal === "edit"}
        onClose={closeModal}
        user={selected}
        roleList={roleList}
        statusList={statusList}
        onSubmit={editUser} />
      

      <DetailUserModal
        open={modal === "detail"}
        onClose={closeModal}
        user={selected} />
      
    </div>);

}

export function UserSearchBar({ value, onChange }) {
  return (
    <SearchBar value={value} onChange={onChange} placeholder="Cari nama / email / role..." />);

}