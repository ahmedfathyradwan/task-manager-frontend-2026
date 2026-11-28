"use client";

import { useState } from "react";
import Icon from "./Icon";
import { getErrorMessage } from "@/app/lib/errors";
import { isSubtaskOverdue } from "@/app/lib/format";
import { useI18n } from "./providers/I18nProvider";
import styles from "./TaskCard.module.css";

export default function SubtaskSection({
  task,
  busyIds,
  onAdd,
  onUpdate,
  onToggle,
  onDelete,
}) {
  const { t, formatDue } = useI18n();
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({ title: "", date: "", time: "" });
  const [addPending, setAddPending] = useState(false);
  const [addError, setAddError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", date: "", time: "" });
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState("");

  const subtasks = task.subtasks ?? [];
  const total = subtasks.length;
  const done = subtasks.filter((subtask) => subtask.completed).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  const openAdd = () => {
    setAdding((current) => !current);
    setAddForm({ title: "", date: "", time: "" });
    setAddError("");
  };

  const closeAdd = () => {
    setAdding(false);
    setAddError("");
  };

  const buildPayload = (form) => ({
    title: form.title.trim(),
    dueDate: form.date || null,
    dueTime: form.date ? form.time || null : null,
  });

  const validate = (form) => {
    if (!form.title.trim()) return t("validation.title");
    if (form.time && !form.date) return t("validation.timeNeedsDate");
    return "";
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    if (addPending) return;

    const validationError = validate(addForm);
    if (validationError) {
      setAddError(validationError);
      return;
    }

    setAddPending(true);
    setAddError("");
    try {
      await onAdd(task, buildPayload(addForm));
      setAddForm({ title: "", date: "", time: "" });
      setAdding(false);
    } catch (error) {
      setAddError(getErrorMessage(error, t));
    } finally {
      setAddPending(false);
    }
  };

  const startEdit = (subtask) => {
    setEditingId(subtask.id);
    setEditForm({
      title: subtask.title,
      date: subtask.dueDate ?? "",
      time: subtask.dueTime ?? "",
    });
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError("");
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    if (editPending) return;

    const validationError = validate(editForm);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    setEditPending(true);
    setEditError("");
    try {
      await onUpdate(task, editingId, buildPayload(editForm));
      setEditingId(null);
    } catch (error) {
      setEditError(getErrorMessage(error, t));
    } finally {
      setEditPending(false);
    }
  };

  return (
    <section className={styles.section} aria-label={t("sub.title")}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionInfo}>
          <span className={styles.sectionTitle}>
            <Icon name="listChecks" size={16} />
            {t("sub.title")}
          </span>
          <span className={styles.counter}>
            {done}/{total}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={openAdd}
          aria-expanded={adding}
          aria-label={t("sub.add")}
        >
          <Icon name="plus" size={15} />
          <span className={styles.addLabel}>{t("sub.add")}</span>
        </button>
      </div>

      {total > 0 && (
        <div className={styles.progress} aria-hidden="true">
          <span className={styles.progressFill} style={{ width: `${percent}%` }} />
        </div>
      )}

      {total === 0 && !adding && (
        <p className={styles.empty}>{t("sub.empty")}</p>
      )}

      {total > 0 && (
        <ul className={styles.list}>
          {subtasks.map((subtask) => {
            if (editingId === subtask.id) {
              return (
                <li key={subtask.id}>
                  <form className={styles.form} onSubmit={handleEdit} noValidate>
                    <input
                      className="input input-sm"
                      value={editForm.title}
                      onChange={(event) =>
                        setEditForm((form) => ({ ...form, title: event.target.value }))
                      }
                      maxLength={200}
                      autoFocus
                      aria-label={t("form.title")}
                    />
                    <div className={styles.formRow}>
                      <input
                        type="date"
                        className="input input-sm"
                        value={editForm.date}
                        onChange={(event) =>
                          setEditForm((form) => ({
                            ...form,
                            date: event.target.value,
                            time: event.target.value ? form.time : "",
                          }))
                        }
                        aria-label={t("form.dueDate")}
                      />
                      <input
                        type="time"
                        className="input input-sm"
                        value={editForm.time}
                        onChange={(event) =>
                          setEditForm((form) => ({ ...form, time: event.target.value }))
                        }
                        disabled={!editForm.date}
                        aria-label={t("form.dueTime")}
                      />
                      <div className={styles.formActions}>
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                          disabled={editPending}
                          aria-label={t("common.save")}
                        >
                          {editPending ? (
                            <span className="spinner" />
                          ) : (
                            <Icon name="check" size={16} />
                          )}
                          <span className={styles.actionLabel}>{t("common.save")}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={cancelEdit}
                          disabled={editPending}
                          aria-label={t("common.cancel")}
                        >
                          <Icon name="x" size={16} />
                        </button>
                      </div>
                    </div>
                    {editError && (
                      <p className="field-error" role="alert">
                        <Icon name="alertCircle" size={13} />
                        {editError}
                      </p>
                    )}
                  </form>
                </li>
              );
            }

            const overdue = isSubtaskOverdue(subtask);
            const busy = busyIds?.has(subtask.id);

            return (
              <li
                key={subtask.id}
                className={`${styles.item} ${subtask.completed ? styles.itemDone : ""}`}
              >
                <button
                  type="button"
                  className={`${styles.subCheck} ${subtask.completed ? styles.subCheckDone : ""}`}
                  onClick={() => onToggle(task, subtask)}
                  disabled={busy}
                  aria-pressed={subtask.completed}
                  aria-label={
                    subtask.completed ? t("task.markActive") : t("task.markDone")
                  }
                >
                  {busy ? (
                    <span className={styles.miniSpinner} />
                  ) : (
                    subtask.completed && <Icon name="check" size={11} strokeWidth={3.2} />
                  )}
                </button>

                <div className={styles.itemBody}>
                  <span className={styles.itemTitle}>{subtask.title}</span>
                  {subtask.dueDate && (
                    <span
                      className={`chip chip-xs ${overdue ? "chip-overdue" : ""} ${styles.dueChip}`}
                    >
                      <Icon name="calendar" size={11} />
                      {formatDue(subtask.dueDate, subtask.dueTime)}
                    </span>
                  )}
                </div>

                <div className={styles.itemActions}>
                  <button
                    type="button"
                    className={styles.miniBtn}
                    onClick={() => startEdit(subtask)}
                    aria-label={t("sub.edit")}
                    title={t("sub.edit")}
                  >
                    <Icon name="pencil" size={14} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.miniBtn} ${styles.miniDanger}`}
                    onClick={() => onDelete(task, subtask)}
                    aria-label={t("sub.delete")}
                    title={t("sub.delete")}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {adding && (
        <form className={`${styles.form} ${styles.addForm}`} onSubmit={handleAdd} noValidate>
          <input
            className="input input-sm"
            value={addForm.title}
            onChange={(event) => {
              setAddForm((form) => ({ ...form, title: event.target.value }));
              if (addError) setAddError("");
            }}
            placeholder={t("sub.placeholder")}
            maxLength={200}
            autoFocus
            aria-label={t("sub.add")}
          />
          <div className={styles.formRow}>
            <input
              type="date"
              className="input input-sm"
              value={addForm.date}
              onChange={(event) =>
                setAddForm((form) => ({
                  ...form,
                  date: event.target.value,
                  time: event.target.value ? form.time : "",
                }))
              }
              aria-label={t("form.dueDate")}
            />
            <input
              type="time"
              className="input input-sm"
              value={addForm.time}
              onChange={(event) =>
                setAddForm((form) => ({ ...form, time: event.target.value }))
              }
              disabled={!addForm.date}
              aria-label={t("form.dueTime")}
            />
            <div className={styles.formActions}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={addPending}>
                {addPending ? <span className="spinner" /> : <Icon name="plus" size={15} />}
                <span className={styles.actionLabel}>{t("sub.save")}</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={closeAdd}
                disabled={addPending}
                aria-label={t("common.cancel")}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          </div>
          {addError && (
            <p className="field-error" role="alert">
              <Icon name="alertCircle" size={13} />
              {addError}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
