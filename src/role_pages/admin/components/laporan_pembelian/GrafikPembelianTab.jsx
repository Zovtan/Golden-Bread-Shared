import { useState, useEffect, useCallback } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer } from
"recharts";
import { useGrafikPembelian } from "../../hooks/useLaporanPembelian";
import StatCard from "../../../../shared/components/StatCard";
import { fmtRp, todayWIB, weekStartWIB, fmtDayMonth } from "../../../../shared/utils/format";

const STATUS_OPTS = [
{ value: "semua", label: "Semua" },
{ value: "Lunas", label: "Lunas" },
{ value: "Tempo", label: "Tempo" },
{ value: "Belum", label: "Belum Bayar" }];

const PERIODE_OPTS = [
{ value: "harian", label: "Harian" },
{ value: "mingguan", label: "Mingguan" },
{ value: "bulanan", label: "Bulanan" }];


function fmtBucketLabel(key, periode) {
  if (periode === "bulanan") {
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1, 1);

  }
  if (periode === "mingguan") return key.replace("-W", " W");
  return fmtDayMonth(key);
}

const fmtTick = (v) => {
  if (v >= 1_000_000) return `Rp${(v / 1_000_000).toFixed(1)}jt`;
  if (v >= 1_000) return `Rp${(v / 1_000).toFixed(0)}rb`;
  return `Rp${v}`;
};


export default function GrafikPembelianTab() {
  const { data, loading, error, fetch, supplierList, fetchSupplier } = useGrafikPembelian();

  const [status, setStatus] = useState("semua");
  const [idSupplier, setIdSupplier] = useState("");
  const [periode, setPeriode] = useState("harian");
  const [dari, setDari] = useState(weekStartWIB());
  const [sampai, setSampai] = useState(todayWIB());
  const [appliedPeriode, setAppliedPeriode] = useState("harian");

  const doFetch = useCallback(
    (extra) => fetch({ status, idSupplier, periode, dari, sampai, ...extra }),
    [fetch, status, idSupplier, periode, dari, sampai]
  );

  useEffect(() => {doFetch();}, []);
  useEffect(() => {fetchSupplier();}, []);
  useEffect(() => {
    const fn = () => {if (document.visibilityState === "visible") doFetch();};
    document.addEventListener("visibilitychange", fn);
    return () => document.removeEventListener("visibilitychange", fn);
  }, [doFetch]);

  const handlePeriodeChange = (val) => {
    setPeriode(val);
    const today = todayWIB();
    if (val === "mingguan") {
      const d = new Date(today + "T00:00:00+07:00");
      d.setDate(d.getDate() - 27);
      setDari(d.toISOString().slice(0, 10));setSampai(today);
    } else if (val === "bulanan") {
      const d = new Date(today + "T00:00:00+07:00");
      d.setMonth(d.getMonth() - 2);
      d.setDate(1);
      setDari(d.toISOString().slice(0, 10));setSampai(today);
    } else {
      setDari(weekStartWIB());setSampai(today);
    }
  };

  const handleFilter = () => {setAppliedPeriode(periode);fetch({ status, idSupplier, periode, dari, sampai });};
  const handleReset = () => {
    const ws = weekStartWIB(),td = todayWIB();
    setStatus("semua");setIdSupplier("");setPeriode("harian");setDari(ws);setSampai(td);setAppliedPeriode("harian");
    fetch({ status: "semua", idSupplier: "", periode: "harian", dari: ws, sampai: td });
  };

  const chartData = data?.chartData ?? [];

  return (
    <div>
      {}
      <div className="laporan-filter">
        <div className="laporan-filter-title">Filter Pembelian:</div>
        <div className="laporan-filter-row">
          <div className="form-field">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Supplier</label>
            <select value={idSupplier} onChange={(e) => setIdSupplier(e.target.value)}>
              <option value="">Semua</option>
              {(supplierList ?? []).map((s) =>
              <option key={s.id_supplier} value={s.id_supplier}>{s.nama_supplier}</option>
              )}
            </select>
          </div>
          <div className="form-field">
            <label>Periode</label>
            <select value={periode} onChange={(e) => handlePeriodeChange(e.target.value)}>
              {PERIODE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Dari</label>
            <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} max={sampai || undefined} />
          </div>
          <div className="form-field">
            <label>Sampai</label>
            <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} min={dari || undefined} />
          </div>
          <button className="btn-primary" onClick={handleFilter} disabled={loading}>
            {loading ? "…" : "Filter"}
          </button>
          <button className="btn-secondary" onClick={handleReset} disabled={loading}>
            Reset
          </button>
        </div>
      </div>

      {error && <p className="db-fetch-error">{error}</p>}

      {}
      {data && (() => {
        const pLabel = appliedPeriode === "mingguan" ? "Minggu Ini" : appliedPeriode === "bulanan" ? "Bulan Ini" : "Hari Ini";
        return (
          <div className="db-stats !mb-5">
          <StatCard value={data.stats.totalPembelian} label="Total Pembelian (Filter)" />
          <StatCard value={data.stats.txHariIni} label={`Transaksi ${pLabel}`} />
          <StatCard value={data.stats.tagihanBelumLunas} label="Tagihan Belum Lunas (Filter)" />
          <StatCard value={data.stats.totalHutang} label="Total Hutang Supplier (Filter)" />
        </div>);

      })()}

      {loading && !data && <p className="db-loading-text">Memuat grafik…</p>}

      {data && chartData.length === 0 && !loading &&
      <p className="db-empty">Tidak ada data pada periode ini.</p>
      }

      {data && chartData.length > 0 &&
      <div className="db-card !p-4">
          <div style={{ width: "100%", height: 320, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => fmtBucketLabel(v, appliedPeriode)}
                angle={chartData.length > 14 ? -35 : 0}
                textAnchor={chartData.length > 14 ? "end" : "middle"}
                height={chartData.length > 14 ? 50 : 30}
                interval="preserveStartEnd" />
              
                <YAxis tickFormatter={fmtTick} tick={{ fontSize: 11 }} width={72} />
                <Tooltip
                labelFormatter={(v) => fmtBucketLabel(v, appliedPeriode)}
                formatter={(val, name) => [
                fmtRp(Number(val)),
                name === "lunas" ? "Lunas" : "Tempo / Belum Bayar"]
                } />
              
                <Legend
                formatter={(v) => v === "lunas" ? "Lunas" : "Tempo / Belum Bayar"} />
              
                <Bar dataKey="lunas" name="lunas" stackId="a" fill="#111827" radius={[3, 3, 0, 0]} />
                <Bar dataKey="tempo" name="tempo" stackId="a" fill="#9ca3af" />
                <Line
                type="monotone"
                dataKey={(d) => d.lunas + d.tempo}
                name="total"
                stroke="#374151" strokeWidth={2} strokeDasharray="5 4"
                dot={{ r: 3, fill: "#374151", strokeWidth: 0 }}
                activeDot={{ r: 5 }} />
              
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      }
    </div>);

}