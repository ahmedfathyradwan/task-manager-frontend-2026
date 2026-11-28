"use client";

import Icon from "./Icon";
import Modal from "./Modal";
import { useI18n } from "./providers/I18nProvider";
import styles from "./Modal.module.css";

export default function ConfirmDialog({
  open,
  title,
  message,
  pending = false,
  onCancel,
  onConfirm,
}) {
  const { t } = useI18n();

  return (
    <Modal open={open} onClose={pending ? () => {} : onCancel} title={title} size="sm">
      <div className={styles.confirmIcon}>
        <Icon name="alertTriangle" size={22} />
      </div>
      <p className={styles.confirmText}>{message}</p>
      <div className={styles.confirmActions}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onCancel}
          disabled={pending}
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={onConfirm}
          disabled={pending}
        >
          {pending && <span className="spinner" />}
          {pending ? t("confirm.deleting") : t("confirm.delete")}
        </button>
      </div>
    </Modal>
  );
}
