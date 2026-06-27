import { useState } from "react";
import { logout } from "../../../shared/utils/logout";
import LogoutModal from "../../../shared/components/LogoutModal";
import {
  validatePhone, PHONE_RULE_TEXT,
  validatePassword, PASSWORD_RULE_TEXT } from
"../../../auth/utils/validation";
import { useSubmitLock } from "../../../shared/hooks/useSubmitLock";
import { usePelangganAkun } from "../hooks/usePelangganAkun";
import { trimStrings } from "../../../shared/utils/trimStrings";


function EditProfilForm({ profile, onSubmit, onSave, onCancel }) {
  const isPrioritas = profile?.jenis_pelanggan === "Prioritas";
  const [form, setForm] = useState({
    nama_lengkap: profile?.nama_lengkap ?? "",
    no_telp: profile?.no_telp ?? "",
    alamat: profile?.alamat ?? "",
    nama_toko: profile?.nama_toko ?? "",
    kata_sandi: "",
    konfirmasi: ""
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const guard = useSubmitLock();

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = guard(async () => {
    setErr(null);
    if (!validatePhone(form.no_telp)) {setErr(PHONE_RULE_TEXT);return;}
    if (form.kata_sandi) {
      if (!validatePassword(form.kata_sandi)) {setErr(PASSWORD_RULE_TEXT);return;}
      if (form.kata_sandi !== form.konfirmasi) {setErr("Konfirmasi kata sandi tidak cocok.");return;}
    }
    setSaving(true);
    try {

      const bersih = trimStrings(form, ["kata_sandi", "konfirmasi"]);

      await onSubmit({
        nama_lengkap: bersih.nama_lengkap,
        no_telp: bersih.no_telp,
        alamat: bersih.alamat,
        nama_toko: isPrioritas ? bersih.nama_toko : null,
        kata_sandi: form.kata_sandi
      });
      const updates = { nama_lengkap: bersih.nama_lengkap, no_telp: bersih.no_telp, alamat: bersih.alamat };
      if (isPrioritas) updates.nama_toko = bersih.nama_toko;
      onSave(updates);
    } catch (e) {setErr(e.message);} finally
    {setSaving(false);}
  });

  return (
    <div className="akun-edit-form">
      <div className="akun-section-title">
        Profil Saya
        <span className="akun-section-sub">Nama, nomor HP, dan data pribadi</span>
      </div>
      <div className="akun-edit-fields">
        <div className="order-field">
          <label>NAMA LENGKAP</label>
          <input value={form.nama_lengkap} onChange={(e) => handleChange("nama_lengkap", e.target.value)} />
        </div>
        <div className="order-field">
          <label>NOMOR HANDPHONE</label>
          <input value={form.no_telp} onChange={(e) => handleChange("no_telp", e.target.value)} />
          <p className="text-xs text-amber-600/80 mt-1">{PHONE_RULE_TEXT}</p>
        </div>
        <div className="order-field">
          <label>KATA SANDI</label>
          <input type="password" value={form.kata_sandi} placeholder="Kosongkan jika tidak diubah"
          onChange={(e) => handleChange("kata_sandi", e.target.value)} />
          <p className="text-xs text-amber-600/80 mt-1">{PASSWORD_RULE_TEXT}</p>
        </div>
        <div className="order-field">
          <label>KONFIRMASI KATA SANDI</label>
          <input type="password" value={form.konfirmasi} onChange={(e) => handleChange("konfirmasi", e.target.value)} />
        </div>
        <div className="order-field" style={{ gridColumn: "1/-1" }}>
          <label>ALAMAT</label>
          <textarea rows={3} value={form.alamat} onChange={(e) => handleChange("alamat", e.target.value)} />
        </div>
        {isPrioritas &&
        <div className="order-field" style={{ gridColumn: "1/-1" }}>
            <label>NAMA TOKO</label>
            <input value={form.nama_toko} onChange={(e) => handleChange("nama_toko", e.target.value)} />
          </div>
        }
      </div>
      {err && <p className="db-fetch-error" style={{ marginTop: ".5rem" }}>{err}</p>}
      <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end", marginTop: ".75rem" }}>
        <button className="btn-secondary" onClick={onCancel}>Batal</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </div>);

}

export default function PelangganAkun({ profile: initialProfile, onLogout }) {
  const { email, updateProfil } = usePelangganAkun();
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const handleSaved = (updates) => {
    setProfile((p) => ({ ...p, ...updates }));
    setEditing(false);
  };

  const handleLogout = async () => {
    try {await logout();} catch (e) {console.error("Gagal logout:", e);}
    onLogout?.();
  };

  return (
    <>
      <div className="akun-page">
        {editing ?
        <EditProfilForm profile={profile} onSubmit={updateProfil} onSave={handleSaved} onCancel={() => setEditing(false)} /> :

        <div className="akun-section akun-profile">
            <div className="akun-section-header">
              <div>
                <div className="akun-section-title">Profil Saya</div>
                <div className="akun-section-sub">Nama, nomor HP, dan data pribadi</div>
              </div>
              <button className="btn-primary akun-edit-btn" onClick={() => setEditing(true)}>Edit</button>
            </div>
            <div className="akun-profile-fields">
              <div className="akun-field">
                <label>NAMA LENGKAP</label>
                <div className="akun-field-value">{profile?.nama_lengkap ?? "-"}</div>
              </div>
              <div className="akun-field">
                <label>EMAIL</label>
                <div className="akun-field-value">{email}</div>
              </div>
              <div className="akun-field">
                <label>NOMOR HANDPHONE</label>
                <div className="akun-field-value">{profile?.no_telp ?? "-"}</div>
              </div>
              <div className="akun-field">
                <label>KATA SANDI</label>
                <div className="akun-field-value">••••••••••••••</div>
              </div>
              <div className="akun-field akun-field-full">
                <label>ALAMAT</label>
                <div className="akun-field-value">{profile?.alamat ?? "-"}</div>
              </div>
              {profile?.jenis_pelanggan === "Prioritas" &&
            <div className="akun-field akun-field-full">
                  <label>NAMA TOKO</label>
                  <div className="akun-field-value">{profile?.nama_toko ?? "-"}</div>
                </div>
            }
            </div>
          </div>
        }

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button className="btn-primary akun-logout-btn" onClick={() => setShowLogout(true)}>
            Logout
          </button>
        </div>
      </div>

      <LogoutModal
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
        variant="amber" />
      
    </>);

}