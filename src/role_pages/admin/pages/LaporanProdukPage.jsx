import { useState } from "react";
import SearchBar from "../../../shared/components/SearchBar";
import OverviewProdukTab from "../components/laporan_produk/OverviewProdukTab";
import ProdukBermasalahTab from "../components/laporan_produk/ProdukBermasalahTab";
import PerubahanProdukTab from "../components/laporan_produk/PerubahanProdukTab";
import HasilProduksiTab from "../components/laporan_produk/HasilProduksiTab";

const TABS = [
{ key: "overview", label: "Overview" },
{ key: "produksi", label: "Hasil Produksi" },
{ key: "bermasalah", label: "Produk Bermasalah" },
{ key: "perubahan", label: "Perubahan" }];



export default function LaporanProdukPage({ search = "" }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div>
      <div className="laporan-tabs db-card !px-5 !py-0 !mb-5">
        {TABS.map((t) =>
        <button
          key={t.key}
          className={`db-tab${activeTab === t.key ? " active" : ""}`}
          onClick={() => setActiveTab(t.key)}>
          
            {t.label}
          </button>
        )}
      </div>

      <div className="db-card">
        {activeTab === "overview" && <OverviewProdukTab search={search} />}
        {activeTab === "bermasalah" && <ProdukBermasalahTab search={search} />}
        {activeTab === "perubahan" && <PerubahanProdukTab search={search} />}
        {activeTab === "produksi" && <HasilProduksiTab search={search} />}
      </div>
    </div>);

}

export function LaporanProdukSearchBar({ value, onChange }) {
  return (
    <SearchBar value={value} onChange={onChange} placeholder="Cari nama / kategori / stok..." />);

}