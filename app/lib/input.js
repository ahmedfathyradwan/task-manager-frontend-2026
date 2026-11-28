const ARABIC_INDIC = /[\u0660-\u0669]/g;
const EXTENDED_ARABIC_INDIC = /[\u06F0-\u06F9]/g;

export const toLatinDigits = (value) =>
  String(value ?? "")
    .replace(ARABIC_INDIC, (char) => String(char.charCodeAt(0) - 0x0660))
    .replace(EXTENDED_ARABIC_INDIC, (char) => String(char.charCodeAt(0) - 0x06f0));

const normalizeEgyptPhone = (digits) => {
  let phone = digits;
  if (phone.startsWith("0020") && phone.length >= 14) phone = phone.slice(4);
  else if (phone.startsWith("20") && phone.length >= 12) phone = phone.slice(2);
  if (phone.length === 10 && phone.startsWith("1")) phone = `0${phone}`;
  return phone.slice(0, 11);
};

export const sanitizePhoneInput = (value) =>
  normalizeEgyptPhone(toLatinDigits(value).replace(/\D/g, ""));

export const sanitizePasswordInput = (value) =>
  toLatinDigits(value).replace(/\D/g, "").slice(0, 4);

export const isValidPhone = (value) => /^01[0125]\d{8}$/.test(value);
