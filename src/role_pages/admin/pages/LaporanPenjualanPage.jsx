import { useState } from "react";
import SearchBar from "../../../shared/components/SearchBar";
import GrafikPenjualanTab from "../components/laporan_penjualan/GrafikPenjualanTab";
import RiwayatPenjualanTab from "../components/laporan_penjualan/RiwayatPenjualanTab";
import ProdukTerlarisTab from "../components/laporan_penjualan/ProdukTerlarisTab";
import PerubahanPenjualanTab from "../components/laporan_penjualan/PerubahanPenjualanTab";

const TABS = [
{ key: "grafik", label: "Grafik" },
{ key: "riwayat", label: "Riwayat" },
{ key: "terlaris", label: "Produk Terlaris" },
{ key: "perubahan", label: "Perubahan" }];




export default function LaporanPenjualanPage({ search = "" }) {
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
        {activeTab === "grafik" && <GrafikPenjualanTab />}
        {activeTab === "riwayat" && <RiwayatPenjualanTab search={search} />}
        {activeTab === "terlaris" && <ProdukTerlarisTab />}
        {activeTab === "perubahan" && <PerubahanPenjualanTab search={search} />}
      </div>
    </div>);

}

export function LaporanSearchBar({ value, onChange, placeholder = "Cari no. pesanan..." }) {
  return (
    <SearchBar value={value} onChange={onChange} placeholder={placeholder} />);

}