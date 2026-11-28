const ARABIC_INDIC = /[\u0660-\u0669]/g;
const EXTENDED_ARABIC_INDIC = /[\u06F0-\u06F9]/g;

export const toLatinDigits = (value) =>
  String(value ?? "")
    .replace(ARABIC_INDIC, (char) => String(char.charCodeAt(0) - 0x0660))
    .replace(EXTENDED_ARABIC_INDIC, (char) => String(char.charCodeAt(0) - 0x06f0));

export const sanitizePhoneInput = (value) =>
  toLatinDigits(value).replace(/\D/g, "").slice(0, 15);

export const sanitizePasswordInput = (value) =>
  toLatinDigits(value).replace(/\D/g, "").slice(0, 4);

export const isValidPhone = (value) => /^\d{8,15}$/.test(value);
