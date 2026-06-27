import { useState, useEffect, useCallback } from "react";
import { useBatasPesanan } from "../../hooks/useBatasPesanan";
import { usePelangganOrder } from "../../hooks/usePelangganOrder";
import QtyInput from "../../../../shared/components/QtyInput";
import { QTY_INPUT_STYLE } from "../../pages/PelangganBeranda";
import { fmtDateLong, fmtRp, todayWIB, fmtDateYMD } from "../../../../shared/utils/format";
import StepBar from "../../../../shared/components/StepBar";
import { isInSiantar, infoOngkir } from "../../../../shared/utils/orderUtils";
import { loadMidtransSnap, createSnapToken, openSnap } from "../../../../shared/utils/midtransUtils";
import LocationPicker from "../../../../shared/components/LocationPicker";
import { supabase } from "../../../../lib/supabase";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";
import { trimStrings } from "../../../../shared/utils/trimStrings";









function Step1({ mode, cart, onSetQty, batas, onNext, onCancel, isOpen }) {
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.harga_num * i.qty, 0);
  const minQty = mode === "segera" ? batas.min_segera : batas.min_preorder;
  const minOk = totalQty >= minQty;

  const maxOk = mode === "segera" ? true : totalQty <= batas.max_preorder;
  return (
    <>
      <div className="order-step-body">
        <div className="order-section-products" style={{ padding: "0 1.25rem" }}>
          <div className="order-section-title">Produk dalam Keranjang</div>
          {cart.length === 0 ?
          <p className="order-empty-cart">Keranjang kosong. Tambah produk dari Beranda terlebih dahulu.</p> :

          <div className="order-product-list">
                {cart.map((item) => {

              const maxQty = mode === "segera" ? item.stok ?? undefined : batas.max_preorder;
              const atMax = mode === "segera" ?
              item.stok !== null && item.qty >= item.stok :
              item.qty >= batas.max_preorder;
              return (
                <div key={item.id} className="order-product-row">
                      <div className="order-product-img">{item.gambar ? <img src={item.gambar} alt={item.nama} /> : <span>[IMG]</span>}</div>
                      <div className="order-product-info">
                        <div className="order-product-name">{item.nama}</div>
                        <div className="order-product-meta">
                          {mode === "segera" ?
                      item.stok != null ? `${item.stok} Stok` : "" :
                      <>{item.kategori}<span style={{ color: "#6b7280", fontSize: ".75rem" }}> · Pre-order</span></>}
                        </div>
                        <div className="order-product-price">{item.harga}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <button type="button" className="cart-qty-btn" onClick={() => onSetQty(item.id, item.qty - 1)}>−</button>
                        <QtyInput value={item.qty} max={maxQty} onChange={(v) => onSetQty(item.id, v)} style={QTY_INPUT_STYLE} />
                        <button type="button" className="cart-qty-btn" onClick={() => onSetQty(item.id, item.qty + 1)} disabled={atMax}>+</button>
                      </div>
                    </div>);

            })}
              </div>

          }
        </div>
        <div className="order-cart-bar">
          <div className="order-cart-bar-header"><span>🛒 Pesanan Kamu</span><span className="order-cart-badge">{totalQty} Item</span></div>
          {cart.map((i) => <div key={i.id} className="order-cart-row"><span>{i.nama}</span><span>x{i.qty} {fmtRp(i.harga_num * i.qty)}</span></div>)}
          <div className="order-confirm-sub"><span>Subtotal</span><span>{fmtRp(subtotal)}</span></div>
          <div className="order-cart-total"><span>Total Bayar</span><span>{fmtRp(subtotal)}</span></div>
          {!minOk && <div className="order-warn">⚠ Minimal {minQty} produk belum terpenuhi ({totalQty}/{minQty})</div>}
          {mode === "preorder" && minOk && !maxOk && <div className="order-warn order-warn-red">⚠ Maksimal {batas.max_preorder} produk terlampaui ({totalQty}/{batas.max_preorder})</div>}
          {!isOpen && <div className="order-warn">⚠ Layanan sedang tidak tersedia saat ini</div>}
        </div>
      </div>
      <div className="order-footer">
        <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
        <button type="button" className="btn-primary" onClick={onNext} disabled={!minOk || !maxOk || cart.length === 0 || !isOpen}>Lanjut ke pengiriman →</button>
      </div>
    </>);

}


function Step2({ mode, form, onChange, onBack, onNext, profile, waktuList }) {
  const [submitted, setSubmitted] = useState(false);
  const [saveAlamat, setSaveAlamat] = useState(false);
  const [savingAlamat, setSavingAlamat] = useState(false);

  const bersih = trimStrings(form);
  const err = {
    nama: !bersih.nama ? "Nama penerima wajib diisi" : "",
    telp: !bersih.telp ? "Nomor telepon wajib diisi" : "",
    alamat: !bersih.alamat ? "Alamat pengiriman wajib diisi" : "",
    lokasi: !form.lat || !form.lng ? "Lokasi pengiriman wajib diisi" : "",


    ...(mode === "preorder" ? {
      tanggal: !form.tanggal ? "Tanggal antar wajib diisi" : "",
      waktu: !form.waktu ? "Waktu antar wajib diisi" : ""
    } : {})
  };
  const valid = Object.values(err).every((v) => !v);
  const show = (k) => submitted && err[k];

  const handleNext = async () => {
    setSubmitted(true);
    if (!valid) return;
    if (saveAlamat && profile?.id && bersih.alamat) {
      setSavingAlamat(true);
      try {await supabase.rpc("pelanggan_update_profil", { p_alamat: bersih.alamat });}
      catch (e) {console.error("Gagal menyimpan alamat:", e);} finally
      {setSavingAlamat(false);}
    }
    onNext();
  };

  return (
    <>
      <div className="order-step-body">
        <div className="order-form-section">
          <div className="order-field">
            <label>NAMA PENERIMA <span style={{ color: "#dc2626" }}>*</span></label>
            <input placeholder="Masukkan nama lengkap" value={form.nama}
            onChange={(e) => onChange("nama", e.target.value)}
            style={show("nama") ? { border: "1px solid #dc2626" } : undefined} />
            {show("nama") && <span style={{ color: "#dc2626", fontSize: ".75rem" }}>{err.nama}</span>}
          </div>
          <div className="order-field">
            <label>NOMOR TELEPON <span style={{ color: "#dc2626" }}>*</span></label>
            <input placeholder="08xx - xxxx - xxxx" value={form.telp}
            onChange={(e) => onChange("telp", e.target.value)}
            style={show("telp") ? { border: "1px solid #dc2626" } : undefined} />
            {show("telp") && <span style={{ color: "#dc2626", fontSize: ".75rem" }}>{err.telp}</span>}
          </div>
          <div className="order-field">
            <label>LOKASI PENGIRIMAN <span style={{ color: "#dc2626" }}>*</span></label>
            <LocationPicker
              lat={form.lat} lng={form.lng}
              onChange={({ lat, lng }) => {onChange("lat", lat);onChange("lng", lng);}}
              required={true}
              variant="amber" />
            
            {form.lat && form.lng &&
            <p style={{ fontSize: ".75rem", color: "#16a34a", margin: ".25rem 0 0" }}>
                ✓ Lokasi dipilih - ongkir dihitung otomatis berdasarkan jarak
              </p>
            }
            {show("lokasi") && <span style={{ color: "#dc2626", fontSize: ".75rem" }}>{err.lokasi}</span>}
          </div>
          <div className="order-field">
            <label>ALAMAT PENGIRIMAN <span style={{ color: "#dc2626" }}>*</span></label>
            <textarea rows={3} placeholder="Masukkan alamat lengkap, cth: Jl. Merdeka No. 12, Kel. Proklamasi"
            value={form.alamat} onChange={(e) => onChange("alamat", e.target.value)}
            style={{ marginTop: 4, width: "100%", boxSizing: "border-box",
              border: show("alamat") ? "1px solid #dc2626" : "1px solid #e5e7eb",
              borderRadius: 7, padding: ".4rem .625rem", fontSize: ".875rem", resize: "vertical" }} />
            {show("alamat") && <span style={{ color: "#dc2626", fontSize: ".75rem" }}>{err.alamat}</span>}
            {form.alamat &&
            <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: ".8125rem", color: "#6b7280", cursor: "pointer" }}>
                <input type="checkbox" checked={saveAlamat} onChange={(e) => setSaveAlamat(e.target.checked)} style={{ margin: 0 }} />
                Simpan alamat ini ke profil saya
              </label>
            }
          </div>
          {}
          {mode === "preorder" &&
          <div className="order-row-2">
              <div className="order-field">
                <label>TANGGAL ANTAR <span style={{ fontSize: ".7rem", color: "#6b7280", fontWeight: 400 }}>(paling cepat besok)</span> <span style={{ color: "#dc2626" }}>*</span></label>
                <input type="date" value={form.tanggal} onChange={(e) => onChange("tanggal", e.target.value)}
              style={show("tanggal") ? { border: "1px solid #dc2626" } : undefined}
              min={(() => {const d = new Date(`${todayWIB()}T00:00:00+07:00`);d.setDate(d.getDate() + 1);return fmtDateYMD(d);})()} />
                {show("tanggal") && <span style={{ color: "#dc2626", fontSize: ".75rem" }}>{err.tanggal}</span>}
              </div>
              <div className="order-field">
                <label>WAKTU ANTAR <span style={{ fontSize: ".7rem", color: "#6b7280", fontWeight: 400 }}>(jam antar)</span> <span style={{ color: "#dc2626" }}>*</span></label>
                <select value={form.waktu} onChange={(e) => onChange("waktu", e.target.value)}>
                  {waktuList.map((w) => <option key={w} value={w}>{w} WIB</option>)}
                </select>
                {show("waktu") && <span style={{ color: "#dc2626", fontSize: ".75rem" }}>{err.waktu}</span>}
              </div>
            </div>
          }
          <div className="order-field">
            <label>CATATAN PEMESANAN</label>
            <textarea rows={2} placeholder="Cth: Jangan terlalu lama"
            value={form.catatan} onChange={(e) => onChange("catatan", e.target.value)} />
          </div>
        </div>
      </div>
      <div className="order-footer">
        <button type="button" className="btn-secondary" onClick={onBack}>← Kembali</button>
        <button type="button" className="btn-primary" onClick={handleNext} disabled={savingAlamat}>
          {savingAlamat ? "Menyimpan…" : "Lanjut ke Konfirmasi →"}
        </button>
      </div>
    </>);

}


function Step3({ mode, cart, form, onChange, ongkir, tierLabel, jarakLabel, onBack, onConfirm, submitting, error }) {
  const subtotal = cart.reduce((s, i) => s + i.harga_num * i.qty, 0);
  const total = subtotal + ongkir;
  const waktuDate = mode === "preorder" && form.tanggal ? new Date(`${form.tanggal}T${form.waktu}:00+07:00`) : null;
  const tglFmt = waktuDate ? fmtDateLong(waktuDate.toISOString()) : "-";
  return (
    <>
      <div className="order-step-body">
        <div className="order-confirm-body" style={{ flex: "none", overflowY: "visible" }}>
          <div className="order-confirm-section">
            <div className="order-confirm-title">RINGKASAN PESANAN</div>
            {cart.map((i) => <div key={i.id} className="order-confirm-row"><span>{i.nama}</span><span>x{i.qty} {fmtRp(i.harga_num * i.qty)}</span></div>)}
            <div className="order-confirm-sub"><span>Subtotal</span><span>{fmtRp(subtotal)}</span></div>
            {ongkir > 0 && <div className="order-confirm-sub"><span>Ongkos Kirim</span><span>{fmtRp(ongkir)}</span></div>}
            {tierLabel && <div className="order-confirm-sub" style={{ color: "#6b7280", fontSize: ".75rem" }}><span>Jarak</span><span>{tierLabel}</span></div>}
            <div className="order-confirm-total"><span>Total Bayar</span><span>{fmtRp(total)}</span></div>
          </div>
          <div className="order-confirm-section">
            <div className="order-confirm-title">METODE PEMBAYARAN</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
              {["Tunai", "Midtrans"].map((m) =>
              <button key={m} type="button"
              onClick={() => onChange("jenisBayar", m)}
              style={{
                padding: ".6rem .75rem", borderRadius: 8, border: "2px solid",
                borderColor: form.jenisBayar === m ? "#d97706" : "#e5e7eb",
                background: form.jenisBayar === m ? "#fffbeb" : "#fff",
                fontWeight: form.jenisBayar === m ? 600 : 400,
                color: form.jenisBayar === m ? "#92400e" : "#374151",
                cursor: "pointer", transition: "all .15s", textAlign: "center", fontSize: ".875rem"
              }}>
                  {m === "Tunai" ? "💵 Tunai (COD)" : "💳 Transfer Online"}
                </button>
              )}
            </div>
            {form.jenisBayar === "Midtrans" &&
            <p style={{ fontSize: ".75rem", color: "#6b7280", marginTop: 6 }}>
                Kamu akan diarahkan ke halaman pembayaran Midtrans setelah konfirmasi.
              </p>
            }
          </div>
          <div className="order-confirm-section">
            <div className="order-confirm-title">DETAIL PENGIRIMAN</div>
            <div className="order-confirm-row"><span>Layanan</span><span>{mode === "segera" ? "Segera Antar" : "Pre-Order"}</span></div>
            <div className="order-confirm-row"><span>Penerima</span><span>{form.nama}</span></div>
            <div className="order-confirm-row"><span>Telepon</span><span>{form.telp}</span></div>
            <div className="order-confirm-row"><span>Alamat</span><span>{form.alamat}</span></div>
            {jarakLabel && <div className="order-confirm-row"><span>Jarak</span><span>{jarakLabel}</span></div>}
            {mode === "preorder" && <div className="order-confirm-row"><span>Hari/Tanggal</span><span>{tglFmt}</span></div>}
            {mode === "preorder" && <div className="order-confirm-row"><span>Waktu Antar</span><span>{form.waktu} WIB</span></div>}
          </div>

          {error && <p className="db-fetch-error" style={{ margin: "0 1.25rem" }}>{error}</p>}
        </div>
      </div>
      <div className="order-footer">
        <button type="button" className="btn-secondary" onClick={onBack}>← Kembali</button>
        <button type="button" className="btn-primary" onClick={onConfirm} disabled={submitting || !form.jenisBayar}>
          {submitting ? "Memproses…" :
          !form.jenisBayar ? "Pilih metode pembayaran" :
          form.jenisBayar === "Midtrans" ? "Lanjut ke Pembayaran →" :
          mode === "segera" ? "✓ Konfirmasi Pemesanan" : "✓ Ajukan Pre-Order"}
        </button>
      </div>
    </>);

}


function OrderModal({ mode, open, onClose, onSuccess, cart, onSetQty, profile }) {
  const { batas, isSegeraAntarOpen, isPreorderOpen } = useBatasPesanan();
  const { submitOrder, confirmPayment, saveSnapToken, submitting, error } = usePelangganOrder();
  const guard = useSubmitLock();


  const waktuList = Array.isArray(batas.waktu_antar_preorder) && batas.waktu_antar_preorder.length > 0 ?
  batas.waktu_antar_preorder : ["07:00"];

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ nama: "", telp: "", alamat: "", catatan: "", tanggal: "", waktu: waktuList[0], jenisBayar: "", lat: null, lng: null });
  const [liveStok, setLiveStok] = useState({});
  const [midError, setMidError] = useState(null);


  const serviceOpen = mode === "segera" ? isSegeraAntarOpen() : isPreorderOpen();
  const accepting = mode === "segera" ? batas.menerima_segera : batas.menerima_preorder;
  const showClosed = mode === "segera" && !serviceOpen;


  useEffect(() => {
    setForm((f) => ({ ...f, waktu: waktuList[0] }));
  }, [batas.waktu_antar_preorder]);


  useEffect(() => {
    if (open && form.jenisBayar === "Midtrans") loadMidtransSnap();
  }, [open, form.jenisBayar]);


  useEffect(() => {
    if (mode !== "segera" || !open || cart.length === 0) return;
    const ids = cart.map((i) => i.id);
    supabase.from("batch_produk").select("id_produk, stok").
    in("id_produk", ids).in("status_stok", ["Normal", "Menipis"]).neq("status_kadaluarsa", "Ya").
    then(({ data }) => {
      const map = {};
      (data ?? []).forEach((b) => {map[b.id_produk] = (map[b.id_produk] ?? 0) + Number(b.stok);});
      setLiveStok(map);
      cart.forEach((i) => {if (map[i.id] !== undefined && i.qty > map[i.id]) onSetQty(i.id, map[i.id]);});
    });
  }, [open]);


  const tryGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (isInSiantar(pos.coords.latitude, pos.coords.longitude))
        setForm((f) => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (!open) {
      setStep(1);setMidError(null);
      setForm({ nama: "", telp: "", alamat: "", catatan: "", tanggal: "", waktu: waktuList[0], jenisBayar: "", lat: null, lng: null });
      return;
    }
    if (profile) setForm((f) => ({
      ...f,
      nama: f.nama || profile.nama_lengkap || "",
      telp: f.telp || profile.no_telp || "",
      alamat: f.alamat || profile.alamat || ""
    }));

    tryGPS();


    let permWatcher = null;
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((status) => {
        permWatcher = status;
        status.onchange = () => {if (status.state === "granted") tryGPS();};
      }).catch(() => {});
    }
    return () => {if (permWatcher) permWatcher.onchange = null;};
  }, [open, tryGPS]);

  if (!open) return null;


  const cartView = mode === "segera" ?
  cart.map((i) => ({ ...i, stok: liveStok[i.id] !== undefined ? liveStok[i.id] : i.stok })) :
  cart;
  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const ongkirBase = Number(batas?.ongkir_base ?? 0);
  const multiplierAktif = batas?.ongkir_multiplier_aktif ?? false;


  const { ongkir, jarakLabel } = infoOngkir(form.lat, form.lng, ongkirBase, multiplierAktif);
  const tierLabel = multiplierAktif ? jarakLabel : null;





  const handleConfirm = guard(async () => {

    if (mode === "segera" ? !isSegeraAntarOpen() : !isPreorderOpen()) return;
    setMidError(null);

    const waktuAntar = mode === "preorder" && form.tanggal ?
    new Date(`${form.tanggal}T${form.waktu}:00+07:00`) :
    null;


    const bersih = trimStrings(form);
    const result = await submitOrder({
      profile,
      cart: cartView,
      jenis: mode,
      jenisBayar: form.jenisBayar,
      waktuAntar,
      lat: form.lat, lng: form.lng,
      ongkir: ongkir || null,
      namaPenerima: bersih.nama || null,
      noTelpPenerima: bersih.telp || null,
      alamatPengiriman: bersih.alamat || "",
      catatan: bersih.catatan || null
    });
    if (!result) return;

    if (form.jenisBayar === "Midtrans") {
      try {
        const snapReady = await loadMidtransSnap();
        if (!snapReady) throw new Error("Gagal memuat halaman pembayaran. Coba lagi.");
        const { token } = await createSnapToken({
          id_pesanan: result.id_pesanan,
          finishUrl: `${window.location.origin}/payment/finish`
        });
        await saveSnapToken(result.id_pesanan, token);
        const { status } = await openSnap(token);
        if (status === "success") {

          await confirmPayment(result.id_pesanan);
          onSuccess?.({ ...result, snapStatus: status });
        } else {


          onSuccess?.({ ...result, snapStatus: "unpaid" });
        }
      } catch (e) {
        setMidError("Terjadi kesalahan pembayaran: " + e.message + " Pesanan tersimpan sebagai Menunggu Pembayaran.");
      }
      return;
    }
    onSuccess?.(result);
  });

  const title = mode === "segera" ? "Segera Antar" : "Pre-Order Produk";
  const sub = mode === "segera" ? "Pesan hari ini – diantarkan dalam 30-60 menit" : "Pesanan dalam jumlah besar";

  return (
    <div className="modal-backdrop">
      <div className="order-modal-box">
        <div className="order-modal-header">
          <div>
            <h2 className="order-modal-title">{title}</h2>
            <p className="order-modal-sub">{sub}</p>
          </div>
        </div>
        {mode === "segera" ?
        <div className="order-syarat">⚠ <strong>Syarat:</strong> Minimal <strong>{batas.min_segera} produk</strong> · Khusus area <strong>Siantar</strong></div> :

        <div className="order-syarat">
            ⚠ <strong>Syarat:</strong> Min. <strong>{batas.min_preorder}</strong> &amp; maks. <strong>{batas.max_preorder} produk</strong> · Khusus area <strong>Siantar</strong>
          </div>
        }

        {showClosed ?
        <div style={{ margin: "1rem 0", padding: "1rem", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontWeight: 600, color: "#dc2626", marginBottom: 4 }}>Layanan tidak tersedia saat ini</div>
            <div style={{ fontSize: ".875rem", color: "#b91c1c" }}>
              Segera Antar hanya tersedia pukul{" "}
              <strong>{batas.jam_mulai_segera}</strong> – <strong>{batas.jam_selesai_segera}</strong> WIB
            </div>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ marginTop: ".75rem" }}>Tutup</button>
          </div> :

        <>
            {mode === "segera" &&
          <div style={{ fontSize: ".75rem", color: "#6b7280", textAlign: "center", marginBottom: ".25rem" }}>
                Tersedia {batas.jam_mulai_segera} – {batas.jam_selesai_segera} WIB
              </div>
          }
            <StepBar step={step} />
            {midError && <p className="db-fetch-error" style={{ margin: "0 1rem .5rem" }}>{midError}</p>}
            {step === 1 &&
          <Step1
            mode={mode} cart={cartView} onSetQty={onSetQty} batas={batas}
            onNext={() => setStep(2)} onCancel={onClose}
            isOpen={serviceOpen && accepting} />

          }
            {step === 2 &&
          <Step2
            mode={mode} form={form} onChange={handleChange}
            onBack={() => setStep(1)} onNext={() => setStep(3)}
            profile={profile} waktuList={waktuList} />

          }
            {step === 3 &&
          <Step3
            mode={mode} cart={cartView} form={form} onChange={handleChange}
            ongkir={ongkir} tierLabel={tierLabel} jarakLabel={jarakLabel}
            onBack={() => setStep(2)} onConfirm={handleConfirm}
            submitting={submitting} error={error} />

          }
          </>
        }
      </div>
    </div>);

}


export function SegeraAntarModal(props) {return <OrderModal mode="segera" {...props} />;}
export function PreOrderModal(props) {return <OrderModal mode="preorder" {...props} />;}

export default OrderModal;