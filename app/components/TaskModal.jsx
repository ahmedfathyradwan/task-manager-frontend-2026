"use client";

import { useState } from "react";
import Icon from "./Icon";
import Modal from "./Modal";
import { getErrorMessage } from "@/app/lib/errors";
import { useI18n } from "./providers/I18nProvider";
import styles from "./TaskModal.module.css";

export default function TaskModal({ open, initialTask, onClose, onSubmit }) {
  if (!open) return null;

  return <TaskDialog initialTask={initialTask} onClose={onClose} onSubmit={onSubmit} />;
}

function TaskDialog({ initialTask, onClose, onSubmit }) {
  const { t } = useI18n();
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [description, setDescription] = useState(initialTask?.description ?? "");
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ?? "");
  const [dueTime, setDueTime] = useState(initialTask?.dueTime ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const isEdit = Boolean(initialTask);

  const handleClose = () => {
    if (!pending) onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pending) return;

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError(t("form.titleRequired"));
      return;
    }

    if (dueTime && !dueDate) {
      setError(t("form.timeNeedsDate"));
      return;
    }

    setPending(true);
    setError("");

    try {
      await onSubmit({
        title: cleanTitle,
        description: description.trim(),
        dueDate: dueDate || null,
        dueTime: dueDate ? dueTime || null : null,
      });
    } catch (err) {
      setError(getErrorMessage(err, t));
      setPending(false);
    }
  };

  return (
    <Modal
      open
      onClose={handleClose}
      title={isEdit ? t("form.editTitle") : t("form.addTitle")}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="label" htmlFor="task-title">
            {t("form.title")}
          </label>
          <input
            id="task-title"
            className="input"
            data-autofocus
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (error) setError("");
            }}
            placeholder={t("form.titlePlaceholder")}
            maxLength={200}
            aria-invalid={!title.trim() && Boolean(error)}
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="task-description">
            <span>{t("form.description")}</span>
            <span className="label-optional">{t("common.optional")}</span>
          </label>
          <textarea
            id="task-description"
            className="textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("form.descriptionPlaceholder")}
            maxLength={2000}
            rows={3}
          />
        </div>

        <div className={styles.dates}>
          <div className="field">
            <label className="label" htmlFor="task-due-date">
              {t("form.dueDate")}
            </label>
            <input
              id="task-due-date"
              type="date"
              className="input"
              value={dueDate}
              onChange={(event) => {
                setDueDate(event.target.value);
                if (!event.target.value) setDueTime("");
              }}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="task-due-time">
              {t("form.dueTime")}
            </label>
            <input
              id="task-due-time"
              type="time"
              className="input"
              value={dueTime}
              onChange={(event) => setDueTime(event.target.value)}
              disabled={!dueDate}
            />
          </div>
        </div>

        {!dueDate && (
          <p className={styles.note}>
            <Icon name="info" size={14} />
            {t("form.timeNeedsDate")}
          </p>
        )}

        {error && (
          <p className="field-error" role="alert">
            <Icon name="alertCircle" size={14} />
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleClose}
            disabled={pending}
          >
            {t("common.cancel")}
          </button>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending && <span className="spinner" />}
            {pending
              ? t("form.saving")
              : isEdit
                ? t("form.save")
                : t("form.create")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
