


import { supabase } from "../../lib/supabase";







export async function validateProductStock(items) {
  const errors = [];
  for (const item of items) {
    const { data: batches } = await supabase.
    from("batch_produk").
    select("stok").
    eq("id_produk", item.id_produk).
    in("status_stok", ["Normal", "Menipis"]).
    neq("status_kadaluarsa", "Ya");
    const available = (batches ?? []).reduce((s, b) => s + Number(b.stok), 0);
    if (Number(item.qty) > available) {
      const label = item.nama ?? `Produk #${item.id_produk}`;
      errors.push(`${label}: diminta ${item.qty}, stok tersedia ${available}`);
    }
  }
  return errors;
}




export async function validateProductStockEdit(newItems, originalItems) {
  const origMap = {};
  for (const i of originalItems) origMap[Number(i.id_produk)] = Number(i.qty);

  const errors = [];
  for (const item of newItems) {
    const id = Number(item.id_produk);
    const delta = Number(item.qty) - (origMap[id] ?? 0);
    if (delta <= 0) continue;

    const { data: batches } = await supabase.
    from("batch_produk").
    select("stok").
    eq("id_produk", id).
    in("status_stok", ["Normal", "Menipis"]).
    neq("status_kadaluarsa", "Ya");
    const available = (batches ?? []).reduce((s, b) => s + Number(b.stok), 0);

    if (delta > available) {
      const label = item.nama ?? `Produk #${id}`;
      errors.push(`${label}: penambahan ${delta} melebihi stok tersedia ${available}`);
    }
  }
  return errors;
}





export async function validateIngredientStock(items) {
  const errors = [];
  for (const item of items) {
    const { data: batches } = await supabase.
    from("batch_bahan_baku").
    select("stok").
    eq("id_bahan", item.id_bahan).
    not("status_stok", "in", "(Habis,Kadaluarsa)").
    neq("status_kadaluarsa", "Ya");
    const available = (batches ?? []).reduce((s, b) => s + Number(b.stok), 0);
    const needed = Number(item.qty);
    if (needed > available) {
      const label = item.nama ?? `Bahan #${item.id_bahan}`;
      const satuan = item.satuan ?? "";
      errors.push(`${label}: dibutuhkan ${needed} ${satuan}, stok tersedia ${available} ${satuan}`.trim());
    }
  }
  return errors;
}





export function stockErrorMessage(errors, header = "Stok tidak mencukupi:") {
  return `${header}\n• ${errors.join("\n• ")}`;
}