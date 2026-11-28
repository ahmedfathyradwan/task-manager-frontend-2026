import { translate } from "./dictionary.js";

export const getErrorMessage = (error, t) => {
  if (!error) return t("error.SERVER_ERROR");

  if (error.code) {
    const key = `error.${error.code}`;
    const message = t(key);
    if (message !== key) return message;
  }

  if (error.message === "Network error") return t("error.NETWORK");
  return t("error.SERVER_ERROR");
};

export const tFrom = (lang) => (key, vars) => translate(lang, key, vars);
