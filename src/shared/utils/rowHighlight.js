




export const rowHl = (statusStok, adaKdl) => {
  if (statusStok === "Kadaluarsa" || statusStok === "Habis" || adaKdl === "Ya")
  return { background: "#fff1f2" };
  if (statusStok === "Menipis" || adaKdl === "Mendekati")
  return { background: "#fffbeb" };
  return {};
};


export const batchRowHl = (status_stok, status_kadaluarsa) => {
  if (status_stok === "Kadaluarsa" || status_stok === "Habis" || status_kadaluarsa === "Ya")
  return { background: "#fff5f5" };
  if (status_stok === "Menipis")
  return { background: "#fefce8" };
  return {};
};