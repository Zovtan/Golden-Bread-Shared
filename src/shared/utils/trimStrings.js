




export function trimStrings(obj, kecuali = []) {
  const out = {};
  for (const [key, val] of Object.entries(obj)) {
    out[key] = typeof val === "string" && !kecuali.includes(key) ? val.trim() : val;
  }
  return out;
}