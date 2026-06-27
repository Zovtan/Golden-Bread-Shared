


export function sumJumlahBahanLain(rows, rowId, id_bahan) {
  return rows.
  filter((r) => r.id !== rowId && r.id_bahan === id_bahan).
  reduce((s, r) => s + (Number(r.jumlah) || 0), 0);
}