




export function cleanPhone(raw = "") {
  return String(raw).replace(/[\s\-().]/g, "");
}



export function toWaNumber(raw = "") {
  let n = cleanPhone(raw).replace(/\+/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);else
  if (!n.startsWith("62")) n = "62" + n;
  return n;
}