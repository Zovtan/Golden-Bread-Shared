import { useState } from "react";
import SearchBar from "../../../shared/components/SearchBar";
import OverviewBahanTab from "../components/laporan_bahan_baku/OverviewBahanTab";
import BahanBermasalahTab from "../components/laporan_bahan_baku/BahanBermasalahTab";
import PerubahanBahanTab from "../components/laporan_bahan_baku/PerubahanBahanTab";
import PemakaianBahanTab from "../components/laporan_bahan_baku/PemakaianBahanTab";

const TABS = [
{ key: "overview", label: "Overview" },
{ key: "pemakaian", label: "Pemakaian Bahan" },
{ key: "bermasalah", label: "Bahan Bermasalah" },
{ key: "perubahan", label: "Perubahan" }];



export default function LaporanBahanBakuPage({ search = "" }) {
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
        {activeTab === "overview" && <OverviewBahanTab search={search} />}
        {activeTab === "pemakaian" && <PemakaianBahanTab search={search} />}
        {activeTab === "bermasalah" && <BahanBermasalahTab search={search} />}
        {activeTab === "perubahan" && <PerubahanBahanTab search={search} />}
      </div>
    </div>);

}

export function LaporanBahanBakuSearchBar({ value, onChange }) {
  return (
    <SearchBar value={value} onChange={onChange} placeholder="Cari nama / jenis / stok..." />);

}