import { useEnums, sel } from "../../../../shared/hooks/useEnums";
import { useState, useEffect } from "react";
import Modal from "../../../../shared/components/Modal";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import ItemSection from "./ItemSection";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";



export default function EditPenjualanModal({ open, onClose, penjualan, kasirList = [], produkList = [], onSubmit, hideKasirField = false }) {
  const { enums } = useEnums();
  const jenisBayarList = sel.jenisBayar(enums);
  const [id_user, setIdUser] = useState("");
  const [jenis_pembayaran, setJenisBayar] = useState("");
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const guard = useSubmitLock();

  useEffect(() => {
    if (!penjualan || !open) return;
    setIdUser(penjualan.kasir_id ?? "");
    setJenisBayar(penjualan.pembayaran ?? "");
    setItems(penjualan.details.length ? penjualan.details.map((d) => ({ id_produk: String(d.id_produk), qty: d.qty })) : [{ id_produk: "", qty: 1 }]);
    setApiError("");
  }, [penjualan, open]);

  const handleSubmit = guard(async () => {
    setApiError("");setSaving(true);
    try {
      const valid = items.filter((i) => i.id_produk && Number(i.qty) > 0);
      if (!valid.length) throw new Error("Tambahkan minimal 1 item yang valid.");
      await onSubmit({ id_penjualan: penjualan.id_penjualan, id_user, jenis_pembayaran,
        items: valid.map((i) => ({ id_produk: Number(i.id_produk), qty: Number(i.qty) })) });
      onClose();
    } catch (e) {setApiError(e.message);} finally {setSaving(false);}
  });

  if (!penjualan) return null;
  return (
    <Modal open={open} onClose={onClose} title="Edit Penjualan Langsung" maxWidth="520px"
    footer={<><button className="btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
               <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan…" : "Edit"}</button></>}>
      {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem" }}>{apiError}</p>}
      {!hideKasirField &&
      <div className="form-field">
          <label>Kasir</label>
          <SearchableSelect
          value={id_user}
          onChange={setIdUser}
          placeholder="Pilih kasir..."
          options={kasirList.map((k) => ({ value: k.id, label: k.nama_lengkap }))} />
        
        </div>
      }
      <ItemSection items={items} produkList={produkList} onChange={setItems} />
      <div className="form-field">
        <label>Jenis Pembayaran</label>
        <SearchableSelect
          value={jenis_pembayaran}
          onChange={setJenisBayar}
          placeholder="Pilih jenis pembayaran..."
          options={jenisBayarList.map((j) => ({ value: j, label: j }))} />
        
      </div>
    </Modal>);

}