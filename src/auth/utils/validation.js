


import { cleanPhone } from "../../shared/utils/phone";




export const PHONE_REGEX = /^(?:\+62|62|0)8\d{8,12}$/;
export const PHONE_RULE_TEXT =
"Gunakan nomor HP Indonesia yang valid, contoh: 0852-7653-8888 atau +6285276538888.";


export function validatePhone(raw = "") {
  return PHONE_REGEX.test(cleanPhone(raw));
}





export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const EMAIL_RULE_TEXT = "Masukkan alamat email yang valid, contoh: nama@email.com.";


export function validateEmail(raw = "") {
  return EMAIL_REGEX.test(raw.trim());
}





export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=[\]{};':"|<>?,./`~-]).{8,}$/;
export const PASSWORD_RULE_TEXT =
"Minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan simbol (mis. ! @ # $).";


export function validatePassword(pw = "") {
  return PASSWORD_REGEX.test(pw);
}