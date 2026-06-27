


export function translateAuthError(message = "") {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials") || m.includes("invalid_credentials"))
  return "Email atau password salah.";

  if (m.includes("email not confirmed"))
  return "Email belum diverifikasi. Cek inbox Anda.";

  if (m.includes("already registered") || m.includes("already exists") || m.includes("user already registered"))
  return "Email sudah terdaftar. Silakan masuk.";



  if (m.includes("users_email_partial_key") || m.includes("duplicate key") && m.includes("email"))
  return "Email sudah terdaftar. Gunakan email lain.";

  if (m.includes("password should be at least"))
  return "Password minimal 8 karakter.";

  if (m.includes("should be different") || m.includes("different from the old") || m.includes("same_password"))
  return "Password baru harus berbeda dari password lama.";

  if (m.includes("too many requests") || m.includes("rate limit") || m.includes("429"))
  return "Terlalu banyak permintaan. Ini adalah batas dari server - tunggu beberapa menit sebelum mencoba lagi.";

  if (m.includes("network") || m.includes("fetch"))
  return "Tidak dapat terhubung ke server. Periksa koneksi Anda.";


  return message;
}