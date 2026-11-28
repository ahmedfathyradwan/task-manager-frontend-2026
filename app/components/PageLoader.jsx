"use client";

import Icon from "./Icon";
import { useI18n } from "./providers/I18nProvider";
import styles from "./PageLoader.module.css";

export default function PageLoader({ label }) {
  const { t } = useI18n();

  return (
    <div className={styles.loader} role="status">
      <span className={styles.logo}>
        <Icon name="check" size={26} strokeWidth={2.8} />
      </span>
      <span className="spinner spinner-lg" />
      <p className={styles.label}>{label || t("common.loading")}</p>
    </div>
  );
}
