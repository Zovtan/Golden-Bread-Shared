import { useState } from "react";
import SearchBar from "../../../shared/components/SearchBar";
import GrafikPembelianTab from "../components/laporan_pembelian/GrafikPembelianTab";
import RiwayatPembelianTab from "../components/laporan_pembelian/RiwayatPembelianTab";
import PembelianTerbanyakTab from "../components/laporan_pembelian/PembelianTerbanyakTab";
import PerubahanPembelianTab from "../components/laporan_pembelian/PerubahanPembelianTab";

const TABS = [
{ key: "grafik", label: "Grafik" },
{ key: "riwayat", label: "Riwayat" },
{ key: "terbanyak", label: "Bahan Terbanyak" },
{ key: "perubahan", label: "Perubahan" }];



export default function LaporanPembelianPage({ search = "" }) {
  const [activeTab, setActiveTab] = useState("grafik");

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  return (
    <div>
      <div className="laporan-tabs db-card !px-5 !py-0 !mb-5">
        {TABS.map((t) =>
        <button
          key={t.key}
          className={`db-tab${activeTab === t.key ? " active" : ""}`}
          onClick={() => handleTabChange(t.key)}>
          
            {t.label}
          </button>
        )}
      </div>

      <div className="db-card">
        {activeTab === "grafik" && <GrafikPembelianTab />}
        {activeTab === "riwayat" && <RiwayatPembelianTab search={search} />}
        {activeTab === "terbanyak" && <PembelianTerbanyakTab />}
        {activeTab === "perubahan" && <PerubahanPembelianTab search={search} />}
      </div>
    </div>);

}

export function LaporanPembelianSearchBar({ value, onChange, placeholder = "Cari no. pembelian…" }) {
  return (
    <SearchBar value={value} onChange={onChange} placeholder={placeholder} />);

}